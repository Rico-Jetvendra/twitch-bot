const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text      = message.split(" ");
        const commands  = ['!change', '!list', '!desc', '!equip', '!fish', '!inv', '!record', '!state', '!stream'];

        if (commands.includes(text[0].toLowerCase())) {
          return;
        }

        if(tags['first-msg']){
            client.say(channel, `🐢 Welcome, @${tags['display-name']}! Cast your fishing line with !fish and see what you can catch!`);
        }

        console.log("TAGS: ", tags);

        io.emit("chatMessage", {platform: "twitch", channel: channel, tags: tags, message: message});
    });
};