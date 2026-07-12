require('dotenv').config();

const api = require('./services/api');

(async () => {
    
    const result = await api.post('/phase1', {
        twitchId: 1234567890
    });

    const whitelistFish = [1,2];
    const fish          = result[0].fish;
    const minMs         = 1000;
    const maxMs         = 5000;
    const randomDelay   = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    const finish = whitelistFish.includes(fish.fish_rarity_id);
    if(finish){
        const finishResult = await api.post('/finish', {
            twitchId: 1234567890,
            catch: result[0]
        });
    }
    
    console.log("A large shadow approaching your bait.");

    setTimeout(async ()=>{
        console.log("The fish is biting!");

    }, randomDelay);
})();