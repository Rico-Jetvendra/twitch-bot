const api = require('../services/api');

module.exports = function(client) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!inv') {
            return;
        }

        const result = await api.get('/inv', {
            twitchId: tags['user-id'],
            message: text[1],
            page: text[2] ?? 1,
        });
        
        client.say(channel, result[0].message);
    });
};