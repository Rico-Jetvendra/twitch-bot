const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");
        const commands = ['!change', '!list', '!desc', '!equipe', '!fish', '!inv', '!record', '!state'];

        if (commands.includes(text[0].toLowerCase())) {
          return;
        }

        io.emit("chatMessage", {platform: "twitch", channel: channel, tags: tags, message: message});
    });
};