const api = require('../services/api');

module.exports = function(client) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!fish') {
            return;
        }

        const phase1 = await api.post('/phase1', {
            twitchId: tags['user_id']
        });

        if(phase1[0].status == 'error'){
            client.say(channel, result[0].message);
        }

        const fish = phase1[0].fish;
        
        // client.say(channel, result[0].message);
    });
};