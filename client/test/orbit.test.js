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
  this.timeout(60000);

  const amount = 3;
  let bots = createBots('Orbit', amount);

  before(function (done) {
    const promises = bots.map((bot) => {
      return new Promise((resolve, reject) => {
        Main.start(bot.id)
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
        assert.equal(bots.length, amount);
        console.log("Waiting 5 seconds for the peers to connect...")
        setTimeout(done, 5000);
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

  describe('constructor', function() {
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
  });

});
