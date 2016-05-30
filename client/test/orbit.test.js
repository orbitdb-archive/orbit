'use strict';

const _          = require('lodash');
const path       = require('path');
const assert     = require('assert');
const IPFS       = require('exports?Ipfs!ipfs/dist/index.js');
const EventStore = require('orbit-db-eventstore');
const Post       = require('ipfs-post');
const Main       = require('../src/main');

// Mute logging
const Logger = require('logplease');
Logger.setLogLevel('ERROR');

const createBots = (prefix, amount) => {
  let bots = [];
  for(var i = 0; i < amount; i ++) {
    bots.push({
      id: i,
      name: `${prefix}-${i}`,
      orbit: null,
      peerId: null
    });
  }
  return bots;
};

describe('Orbit Skynet', function() {
  this.timeout(600000);

  const botCount = 2;
  let bots = createBots('Orbit', botCount);

  before(function (done) {
    const promises = bots.map((bot) => {
      return new Promise((resolve, reject) => {
        Main.start(new Date().getTime())
        // Main.start(bot.id)
          .then((res) => Object.assign(bot, res))
          .then((res) => {
            setTimeout(() => resolve(res), 1000);
          })
          .catch(reject);
      });
    });

    Promise.all(promises)
      .then((res) => {
        bots = res;
        assert.equal(bots.length, botCount);
        console.log("Waiting 3 seconds for the peers to connect...")
        setTimeout(done, 3000);
      })
      .catch((e) => {
        console.log(e.stack);
        assert.equal(e, null);
        done(e);
      });
  });

  after((done) => {
    bots.forEach((e) => e.orbit.disconnect());
    done();
  });

  describe('network stress', function() {
    it.only('creates an instance', (done) => {
      console.log();
      Promise.all(bots.map((bot) => {
        return bot.orbit.getSwarmPeers().then((peers) => {
          console.log(`${bot.name}'s peers:`);
          peers.forEach((e) => console.log(e));
          console.log();
          const botIds = bots.map((e) => e.peerId.ID).filter((e) => e !== bot.peerId.ID);
          assert.equal(peers.length, 2);
          peers = peers.map((e) => e.split("/").pop());
          assert.equal(peers[0] === botIds[0] || peers[0] === botIds[1], true);
          assert.equal(peers[1] === botIds[0] || peers[1] === botIds[1], true);
        });
      }))
      .then((res) => done())
      .catch((e) => {
        console.error(e);
        done(e);
      })
    });

    it.only('sends messages', (done) => {
      const network = 'QmRB8x6aErtKTFHDNRiViixSKYwW1DbfcvJHaZy1hnRzLM';
      const channel = "hithere" + new Date().getTime();
      const howManyMessages = 50;
      let doneCount = howManyMessages;// * bots.length;
      console.log();
      Promise.all(bots.map((bot, index) => {
        let receivedMessagesCount = 0;
        bot.orbit.events.on('sync', (channelName) => {
          console.log(bot.name + " started syncing", channelName);
        });
        if(index === 1) {
          bot.orbit.events.on('message', (channelName, hash) => {
            console.log(bot.name + " received new head from pubsub", hash);
          });
        }
        bot.orbit.events.on('synced', (channelName, items) => {
          console.log(bot.name + " synced " + channelName + " with " + items.length + " new items");
          console.log("Message:", items[0].payload.value);
        });
        return bot.orbit.connect(network, bot.name, '')
          .then(() => bot.orbit.join(channel))
          .then(() => {
            return bot;
          });
      })).then((res) => {
        let allMessagesCount = 0;
        res.forEach((bot, index) => {
          // Send messages at an interval
          let sentMessagesCount = 0;
          setTimeout(() => {
            setInterval(() => {
              if(sentMessagesCount < howManyMessages && index === 0) {
                sentMessagesCount ++;
                allMessagesCount ++;
                const message = `Hello world ${sentMessagesCount} from ${bot.name}`;
                bot.orbit.sendMessage(channel, message).then((res) => {
                  console.log(bot.name, res.Post.content, res.Hash);
                });
              }
            }, 3000);
          // }, (index * 1000))
          }, 1000)

          // Check the results
          setInterval(() => {
            if(allMessagesCount === doneCount && index === 1) {
              setInterval(() => {
                const messages = bot.orbit.getMessages(channel, null, null, 100);
                // console.log(bot.name + ">" + JSON.stringify(messages, null, 2));
                assert.equal(messages.length, doneCount);
                assert.equal(messages[0].payload.op, 'ADD');
                // assert.equal(messages[0].payload.value, message.Hash);
                assert.notEqual(messages[0].payload.meta, null);
                assert.notEqual(messages[0].payload.meta.ts, null);
                assert.equal(messages[0].hash.startsWith('Qm'), true);
                assert.equal(messages[0].next.length, 0);
                done();
              }, 5000);
            }
          }, 1000)

        });
      })
    });
  });


});
