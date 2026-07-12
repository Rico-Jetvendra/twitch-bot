const api = require('../services/api');

module.exports = function(client) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!change') {
            return;
        }

        const result = await api.post('/change', {
            message: text[1]
        });
        
        client.say(channel, result[0].message);
    });
};