const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!change') {
            return;
        }

        if (!isAllowed(tags)) {
            client.say(channel, "This command is for moderators only.");
            return;
        }

        const result = await api.post('/change', {
            message: text[1]
        });
        
        io.emit("chatMessage", {platform: "twitch", channel: channel, tags: tags, message: result.message, command: true});
        client.say(channel, result.message);
    });
};

function isBroadcaster(tags) {
    return tags.badges?.broadcaster === '1';
}

function isModerator(tags) {
    return tags.mod;
}

function isAllowed(tags) {
    return isBroadcaster(tags) || isModerator(tags);
}