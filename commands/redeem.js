const WebSocket = require('ws');
const api       = require('../services/api');
const ws        = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

module.exports = function(client) {
  let twitch    = null;

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    switch (data.metadata.message_type) {
      case "session_welcome":
        twitch = await subscribe(data);
        break;
      case "session_keepalive":
        break;
      case "notification":
        if (data.payload.subscription.type !== "channel.channel_points_custom_reward_redemption.add") {
          return;
        }

        const redemption = data.payload.event;
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
  });
}

async function subscribe(data){
  return await api.twitchPost('/eventsub/subscriptions', {
    type: "channel.channel_points_custom_reward_redemption.add",
    version: "1",
    condition: {
        broadcaster_user_id: process.env.BROADCASTER_ID
    },
    transport: {
      method: "websocket",
      session_id: data.payload.session.id
    }
  });
}