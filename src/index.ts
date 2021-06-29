import { config } from 'dotenv'
import { Client } from 'discord.js'
import { Message } from 'discord.js'

import handleMessage from './modules/handleMessage'
import testHandle from './modules/testffmpeg'

{
    const { TIMEOUT, TOKEN } = process.env;
    if (TIMEOUT === undefined || TOKEN === undefined) config();
}

const client = new Client();

// Some stuff in case the client's upload speed is slow. Increase if nessesary
client.options.restRequestTimeout = <number | undefined> process.env.TIMEOUT ?? 15000;
client.options.retryLimit = 0;

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    client.user?.setPresence({ activity: { name: 'Send TikTok links for videos in chat!' } });
});

client.on('message', handleMessage);

client.login(process.env.TOKEN);

//testHandle("https://www.tiktok.com/@tylercobb51/video/6979006658081017094?sender_device=pc&sender_web_id=6976529144838505990&is_from_webapp=v1&is_copy_url=0")