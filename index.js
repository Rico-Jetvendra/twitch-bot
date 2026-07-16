require('dotenv').config();
const api = require('./services/api');

const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

let streamInfo = {};

server.listen(3000, async () => {
    console.log("Socket.IO listening on port 3000");
    
    try {
        const result = await api.twitchGet('/channels', {
            broadcaster_id: process.env.BROADCASTER_ID
        });

        streamInfo = result.data[0];
    } catch(err) {
        console.error(err);
    }
});

io.on("connection", (socket) => {
    socket.emit("changeStreamInfo", streamInfo);
});

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

    require(path.join(commandsPath, file))(client, io);
});

client.connect();