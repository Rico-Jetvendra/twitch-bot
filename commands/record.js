const api = require('../services/api');

module.exports = function(client) {
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
        
        client.say(channel, result[0].message);
    });
};