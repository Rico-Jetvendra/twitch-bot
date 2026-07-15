const api = require('../services/api');

module.exports = function(client, io) {
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        const text = message.split(" ");

        if (text[0].toLowerCase() !== '!fish') {
            return;
        }

        await startFishing(client, channel, tags, io);
    });
};

async function startFishing(client, channel, tags, io){
    const randomDelay  = random(1000, 5000);
    const phase1Result = await phase1(client, channel, tags, io);

    if (phase1Result.finish) {
        sendChat(client, channel, tags, phase1Result.message, io);
        return;
    }

    sendChat(client, channel, tags ,"A large shadow approaching your bait.", io);
    setTimeout(async () => {
        await phase2(client, channel, tags, phase1Result.result, io);
    }, randomDelay);
}

async function phase1(client, channel, tags, io) {
    const result = await api.post('/phase1', {
        twitchId: tags['user-id'],
        username: tags.username,
        display_name: tags['display-name'],
    });

    if(result.status == 'error'){
        return {finish: true, 'message': result.message};
    }

    const whitelistFish = [1,2];
    const fish          = result.fish;
    
    const finish = whitelistFish.includes(fish.fish_rarity_id);
    if(finish){
        const finishResult = await api.post('/finish', {
            twitchId: tags['user-id'],
            catch: result
        });

        await api.put('/bait/'+tags['user-id']);

        io.emit("recordUpdated", finishResult.overlays);
        return {finish: true, 'message': finishResult.message};
    }

    return {finish: false, result: result};
}

async function phase2(client, channel, tags, result, io) {
    const phase2 = await api.post('/phase2', {
        twitchId: tags['user-id'],
        catch: result
    });
    
    if(phase2.status == 'error'){
        sendChat(client, channel, tags, phase2.message, io);
        return;
    }

    sendChat(client, channel, tags, phase2.message, io);
    setTimeout(async () => {
        sendChat(client, channel, tags, phase2.fish.fish.fish_name + " is trashing around the water!", io);

        setTimeout(async () => {
            const phase3 = await api.post('/phase3', {
                twitchId: tags['user-id'],
                catch: result
            });

            io.emit("recordUpdated", phase3.overlays);
            sendChat(client, channel, tags, phase3.message, io);
        }, random(1000, 5000));
    }, random(1000, 2000));
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendChat(client, channel, tags, chat, io){
    io.emit("chatMessage", {platform: "twitch", channel: channel, tags: tags, message: "@"+tags['display-name']+" "+chat, command: true});
    client.say(channel, "@"+tags['display-name']+" "+chat);
}