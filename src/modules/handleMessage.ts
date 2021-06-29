import { Message, MessageAttachment } from 'discord.js'
import axios, { AxiosResponse } from 'axios'
import ffmpeg from "ffmpeg.js/ffmpeg-mp4";
import getTikTokLink from './checkTikTok'
import getTikTokCdnURL from './tikTokCdn'

export default async (msg: Message) => {
    const tikTokLinks = getTikTokLink(msg.content);

    if (msg.author.bot) return;
    if (tikTokLinks === null) return;

    //msg.channel.startTyping(tikTokLinks.length);
    let opts: ffmpeg.Options = { 
        arguments: ["-y", "-i", "input", "-c:v", "libx264", "-preset", "medium", "-b:v", "555k", "-pass", "1", "-c:a", "libfdk_aac", "-b:a", "128k", "-f", "mp4", "/dev/null"]
    };
    
    let result = ffmpeg(opts);
    console.log(result);
    msg.channel.stopTyping();
    tikTokLinks.forEach(async tikTokLink => {
        const cdnURL = await getTikTokCdnURL(tikTokLink);

        const vidBuf: AxiosResponse<Buffer> = await axios.get(cdnURL, { responseType: 'arraybuffer' });
       let attachment: MessageAttachment

        if(vidBuf.data.length / 1000 > 8000) {
            var videoBitrate: number = 500;
            var videoDesiredBitrate: number = 500;
            let printhandler = (message: string) => {
                if(message.includes("bitrate: ")) {
                    let index = message.indexOf("bitrate: ") + "bitrate: ".length;
                    let substr = message.substr(index);
                    let bitrate = substr.replace(" kb/s", "");
                    let bitrateInt = Number(bitrate);
        
                    console.log(bitrateInt);
                    let sizeInKB = vidBuf.data.length / 1000;
                    let bitrateKB = videoBitrate / 8;
                    let durationSeconds = sizeInKB / bitrateKB;
                
                    let desiredBitrate =  ((7 * 8192) / durationSeconds) - 128 ;
                    console.log("desired bitrate " + desiredBitrate);
        
                     //msg.channel.startTyping(tikTokLinks.length);
                    console.log(durationSeconds);
        
                    videoBitrate = bitrateInt;
                    videoDesiredBitrate = desiredBitrate;
                }
            }
        
            let getBitrateOpts: ffmpeg.Options = { 
                MEMFS: [{name: "test.mp4", data: vidBuf.data}],
                arguments: ["-y", "-i", "test.mp4"],
                printErr: printhandler
            };
            let bitrateResult = ffmpeg(getBitrateOpts);
        
        
            let convertOptsPassOne: ffmpeg.Options = { 
                MEMFS: [{name: "test.mp4", data: vidBuf.data}],
                arguments: ["-y", "-i", "test.mp4", "-preset", "ultrafast", "-c:v", "libx264", "-b:v", ""+videoDesiredBitrate+"k", "-pass", "1", "-an", "-f", "null", "/dev/null"]
            };
            let passOne = ffmpeg(convertOptsPassOne);
        
            let convertOptsPassTwo: ffmpeg.Options = { 
                MEMFS: [{name: "test.mp4", data: vidBuf.data}, {name: "ffmpeg2pass-0.log", data: passOne.MEMFS[0].data}],
                arguments: ["-i", "test.mp4", "-preset", "ultrafast", "-c:v", "libx264", "-b:v", ""+videoDesiredBitrate+"k", "-pass", "2", "-c:a", "aac", "-b:a", "128k", "output.mp4"]
            };
        
            let passTwo = ffmpeg(convertOptsPassTwo);
            attachment = new MessageAttachment(Buffer.from(passTwo.MEMFS[0].data), 'tiktok.mp4');

        } else {
            attachment = new MessageAttachment(vidBuf.data, 'tiktok.mp4');

        }

        try {
            await msg.channel.send({ files: [ attachment ] });
        } catch (error) {
            msg.channel.send(cdnURL);
            //msg.reply("Failed to send video! Error " + error);
        } finally {
            msg.channel.stopTyping();
        }
    });


    
    msg.channel.stopTyping();
}
