const WebSocket = require('ws');
const api       = require('../services/api');
const ws        = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

module.exports = function(client, io) {

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    switch (data.metadata.message_type) {
      case "session_welcome":
        await subscribeEvent(
          data.payload.session.id,
          "channel.channel_points_custom_reward_redemption.add",
          "1"
        );

        await subscribeEvent(
          data.payload.session.id,
          "channel.update",
          "2"
        );

        break;
      case "session_keepalive":
        break;
      case "notification":
        switch (data.payload.subscription.type) {
          case "channel.update":
            let streamInfo = {};
            streamInfo.game_name = data.payload.event.category_name;

            io.emit("changeStreamInfo", streamInfo);
            break;
          case "channel.channel_points_custom_reward_redemption.add":
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
        break;
    }
  });
}

async function subscribeEvent(sessionId, type, version) {
    return api.twitchPost('/eventsub/subscriptions', {
      type,
      version,
      condition: {
        broadcaster_user_id: process.env.BROADCASTER_ID
      },
      transport: {
        method: "websocket",
        session_id: sessionId
      }
    });
}