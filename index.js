require('dotenv').config();

const tmi   = require('tmi.js');
const fs    = require('fs');
const path  = require('path');

const client = new tmi.Client({
    identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.BOT_OAUTH,
    },
    channels: [
        process.env.CHANNEL
    ]
});

const commandsPath = path.join(__dirname, 'commands');

fs.readdirSync(commandsPath).forEach(file => {
    if (!file.endsWith('.js')) return;

    require(path.join(commandsPath, file))(client);
});

client.connect();