const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!record') {
            return;
        }

        const result = await api.get('/record', {
            twitchId: tags['user-id'],
            page: text[1] ?? 1,
        });
        
        io.emit("chatMessage", {platform: "twitch", channel: channel, tags: tags, message: result.message, command: true});
        client.say(channel, result.message);
    });
};