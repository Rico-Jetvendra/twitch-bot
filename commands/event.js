const WebSocket     = require('ws');
const api           = require('../services/api');
const world         = {
  locationLoop: null,
  seasonLoop: null,
  weatherLoop: null,
  reminderLoop: null,
  location: null,
  season: null,
  weather: null,
  city: "Endral",
};

const reminderMessages = [
  "🎣 New here? Type !fish to grab your first fishing rod and start your adventure!",
  "❤️ Enjoying the stream? Don't forget to hit the Follow button so you don't miss future adventures!",
  "💬 Lurkers are always welcome! Feel free to chat or simply enjoy the stream.",
  "🥤 Hydration check! Grab a drink of water—you deserve it.",
  "🧘 Stretch your arms and shoulders every now and then. Your body will thank you!",
  "📺 If you're having fun, consider sharing the stream with a friend who loves cozy games and fishing.",
  "📹 Missed a stream? Check out the VODs over on YouTube!",
  "🎁 Channel Points aren't just for show! Redeem them to get bait and help your fishing journey.",
  "🎣 Different bait attracts different fish. Spend your Endral Notes wisely!",
  "🗺️ Keep an eye on the weather and location. Some fish appear more often under certain conditions.",
  "✨ Thanks for hanging out today. Your company makes the stream even more fun!",
  "🎮 Have suggestions for the fishing game? Let me know in chat—I love hearing your ideas!",
];

const eventName = {
  "stream.online": "1",
  "stream.offline": "1",
  "channel.channel_points_custom_reward_redemption.add": "1",
  "channel.follow": "2",
  "channel.subscribe": "1",
  "channel.subscription.gift": "1",
  "channel.cheer": "1",
  "channel.raid": "1",
  "channel.update": "2",
};

let keepAliveTimeout, lastHeartbeat, connected, sessionId;
let ws = null;
let reconnecting = false;

const streamInfo = {game_name: null};
const stream     = {live: false, startedAt: null};

module.exports = function(client, io) {
  connect(client, io);
}

async function subscribeEvent(sessionId, type, version) {
  let condition = {
    broadcaster_user_id: process.env.BROADCASTER_ID
  };

  switch (type) {
    case "channel.raid":
      condition = {
        to_broadcaster_user_id: process.env.BROADCASTER_ID
      };
      break;
    case "channel.follow":
      condition = {
        broadcaster_user_id: process.env.BROADCASTER_ID,
        moderator_user_id: process.env.BROADCASTER_ID
      };
      break;
  }

  return await api.twitchPost('/eventsub/subscriptions', {
    type,
    version,
    condition,
    transport: {
      method: "websocket",
      session_id: sessionId
    }
  });
}

async function handleNotification(payload, client, io){
  switch (payload.subscription.type) {
    case "stream.online": {
        stream.live = true;
        stream.startedAt = new Date(payload.event.started_at);

        await getCurrentState();

        if (!world.locationLoop) {
          locationLoop(true, client);
        }
        if (!world.seasonLoop) {
          seasonLoop(true, client);
        }
        if (!world.weatherLoop) {
          weatherLoop(true, client);
        }
        if (!world.reminderLoop) {
          reminderLoop(true, client);
        }

        console.log("STREAM STARTED AT: ", stream.startedAt);
      break;
    }
    case "stream.offline": {
        stream.live = false;
        stream.startedAt = null;

        locationLoop(false, client);
        seasonLoop(false, client);
        weatherLoop(false, client);
        reminderLoop(false, client);
      break;
    }
    case "channel.follow": {
        const follower = payload.event;
        const message  = `Thanks for following, @${follower.user_name}! Welcome aboard!`;

        client.say(`#${process.env.CHANNEL}`, message);
        io.emit("notice", {type:"follow", event: follower});
      break;
    }
    case "channel.subscribe": {
        const subscriber = payload.event;
        let message      = `Thank you joining the merchant guild, @${subscriber.user_name}! Enjoy the stay!`;

        await api.post('/subscriber', {
          twitchId: subscriber.user_id,
          username: subscriber.user_login,
          display_name: subscriber.user_name,
          tier: subscriber.tier,
        });

        if(subscriber.is_gift){
          message = `Welcome @${subscriber.user_name}! Enjoy your stay on the merchant guild!`;
        }

        client.say(`#${process.env.CHANNEL}`, message);
      break;
    }
    case "channel.subscription.gift": {
        const gifter     = payload.event;
        const username   = gifter.is_anonymous ? "Our Anonymous Benefactor" : gifter.user_name;
        const message    = `Thank you, ${username}, for giving the fishermen ${gifter.total} boxes of gifts!`;

        client.say(`#${process.env.CHANNEL}`, message);
        if(gifter.cumulative_total && gifter.cumulative_total > 25){  
          const msg = `${username} has been giving ${gifter.cumulative_total} boxes of gifts to the fishermen!`;
          client.say(`#${process.env.CHANNEL}`, msg);
        }
      break;
    }
    case "channel.cheer": {
        const gifter     = payload.event;
        const username   = gifter.is_anonymous ? "Anonymous Benefactor" : gifter.user_name;
        const message    = `Thank you, ${username}, for ${gifter.bits} ${world.city} Notes!`;
        if(gifter.message){
          message += ` "${gifter.message}"`;
        }
        
        client.say(`#${process.env.CHANNEL}`, message);
      break;
    }
    case "channel.raid": {
        const raider      = payload.event;
        const raider_name = raider.from_broadcaster_user_name;
        const message     = `A ship led by ${raider_name} has arrived with ${raider.viewers} crew members on board. Welcome aboard, travelers!`;
        
        client.say(`#${process.env.CHANNEL}`, message);
      break;
    }
    case "channel.update": {
      streamInfo.game_name = payload.event.category_name;

      io.emit("changeStreamInfo", streamInfo);
      break;
    }
    case "channel.channel_points_custom_reward_redemption.add": {
        const redemption = payload.event;
        const redeem     = await api.get('/redeem', {
          user_id: redemption.user_id,
          reward: redemption.reward
        });

        if (redeem.status == 'error') {
          await api.twitchPatch(
            `/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.BROADCASTER_ID}&reward_id=${redemption.reward.id}&id=${redemption.id}`,
            {
              status: "CANCELED"
            }
          );

          client.say(
            `#${process.env.CHANNEL}`,
            `@${redemption.user_name} ${redeem.message}`
          );

          return;
        }

        await api.twitchPatch(
          `/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.BROADCASTER_ID}&reward_id=${redemption.reward.id}&id=${redemption.id}`,
          {
            status: "FULFILLED"
          }
        );
        
        client.say(
          `#${process.env.CHANNEL}`,
          `@${redemption.user_name} ${redeem.message}`
        );
      break;
    }
  }
}

async function locationLoop(loop = false, client){
  if(loop){
    try {
      await changeLocation(client);
    } catch (err) {
      console.error(err);
    } finally {
      world.locationLoop = setTimeout(() => {
        locationLoop(true, client);
      }, 45 * 60 * 1000);
    }
  }else{
    clearTimeout(world.locationLoop);
    world.locationLoop = null;
  }
}

async function seasonLoop(loop = false, client){
  if(loop){
    try {
      await changeSeason(client);
    } catch (err) {
      console.error(err);
    } finally {
      world.seasonLoop = setTimeout(() => {
        seasonLoop(true, client);
      }, 30 * 60 * 1000);
    }
  }else{
    clearTimeout(world.seasonLoop);
    world.seasonLoop = null;
  }
}

async function weatherLoop(loop = false, client){
  if(loop){
    try {
      await changeWeather(client);
    } catch (err) {
      console.error(err);
    } finally {
      world.weatherLoop = setTimeout(() => {
        weatherLoop(true, client);
      }, 15 * 60 * 1000);
    }
  }else{
    clearTimeout(world.weatherLoop);
    world.weatherLoop = null;
  }
}

async function reminderLoop(loop = false, client){
  if(loop){
    try {
      await chatReminder(client);
    } catch (err) {
      console.error(err);
    } finally {
      world.reminderLoop = setTimeout(() => {
        reminderLoop(true, client);
      }, 20 * 60 * 1000);
    }
  }else{
    clearTimeout(world.reminderLoop);
    world.reminderLoop = null;
  }
}

async function changeLocation(client){
  const result = await api.post("/location");

  client.say(`#${process.env.CHANNEL}`, result.message);
}

async function changeSeason(client){
  const result = await api.post("/season");

  client.say(`#${process.env.CHANNEL}`, result.message);
}

async function changeWeather(client){
  const result = await api.post("/weather");

  client.say(`#${process.env.CHANNEL}`, result.message);
}

async function chatReminder(client){
  const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
  
  client.say(`#${process.env.CHANNEL}`, randomMessage);
}

async function getCurrentState(){
  const result = await api.get("/currentState");

  world.location = result.data.location_name;
  world.season   = result.data.season_name;
  world.weather  = result.data.weather_name;
  world.city     = result.data.city_name;
}

async function handleMessage(message, client, io) {
  const data = JSON.parse(message);

  switch (data.metadata.message_type) {
    case "session_welcome":
      sessionId = data.payload.session.id;
      if(!reconnecting){
        for (const [type, version] of Object.entries(eventName)) {
          try {
            await subscribeEvent(sessionId, type, version);
            // console.log(`Subscribed: ${type}`);
          } catch (err) {
            console.error(`Failed: ${type}`, err);
          }
        }
      }else{
        reconnecting = false;
      }

      keepAliveTimeout = data.payload.session.keepalive_timeout_seconds;
      lastHeartbeat = Date.now();
      connected = true;

      break;
    case "session_keepalive":
      break;
    case "notification":
      await handleNotification(data.payload, client, io);
      break;
    case "session_reconnect":
      reconnecting = true;
      connect(client, io, data.payload.session.reconnect_url);
      break;
    case "revocation":
      const sub = data.payload.subscription;
      switch (sub.status) {
        case "authorization_revoked":
          console.error("Broadcaster token revoked.");
          break;
        case "user_removed":
          console.error("Application disconnected.");
          break;
        case "version_removed":
          console.error("Update EventSub version.");
          break;
        default:
          console.error("Unknown revocation reason.");
      }
      break;
  }
}

function connect(client, io, url = "wss://eventsub.wss.twitch.tv/ws") {
  let oldWs = ws;

  ws = new WebSocket(url);

  ws.on("message", async (message) => {
    try {
      await handleMessage(message, client, io);
    } catch (err) {
      console.error(err);
    }
  });

  ws.on("close", () => {
    console.log("Disconnected");
  });

  ws.on("error", console.error);
  
  if (oldWs) {
    oldWs.removeAllListeners();
    oldWs.close();
  }
}