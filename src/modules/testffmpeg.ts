import axios, { AxiosResponse } from 'axios'
import ffmpeg from "ffmpeg.js/ffmpeg-mp4";
export default async (textmsg: string) => {

    const vidBuf: AxiosResponse<Buffer> = await axios.get(textmsg, { responseType: 'arraybuffer' });
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


    console.log(bitrateResult);
    console.log(passOne);
    console.log(passTwo);
    console.log(passTwo.MEMFS[0].data.length);
}