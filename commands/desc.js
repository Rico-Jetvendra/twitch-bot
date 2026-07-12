const api = require('../services/api');

module.exports = function(client) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!desc') {
            return;
        }

        const result = await api.get('/desc', {
            message: text[1]
        });
        
        client.say(channel, result.message);
    });
};