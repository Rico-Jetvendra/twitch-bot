const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!stream') {
            return;
        }

        const result = await api.twitchGet('/channels', {
            broadcaster_id: process.env.BROADCASTER_ID
        });

        io.emit("changeStreamInfo", result.data[0]);
    });
};