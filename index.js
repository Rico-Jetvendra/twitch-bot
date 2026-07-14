require('dotenv').config();

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

server.listen(3000, () => {
    console.log("Socket.IO listening on port 3000");
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