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

describe('Orbit Skynet', function() {
  this.timeout(60000);

  let clients = [];

  before(function (done) {
    const amount = 3;
    let bots = [];
    for(var i = 0; i < amount; i ++) {
      bots.push({ id: i, name: `Orbit-${i}` });
    }

    const promises = bots.map((bot) => {
      return Main.start(bot.id)
        .then((res) => {
          Object.assign(bot, { orbit: res });
          return bot;
        })
        .then(() => bot);
    });

    Promise.all(promises)
      .then((res) => {
        clients = res;
        assert.equal(clients.length, amount);
        console.log("Waiting 5 seconds for the peers to connect...")
        setTimeout(done, 5000);
      })
      .catch((e) => {
        console.log(e.stack);
        assert.equal(e, null);
        done();
      });
  });

  after((done) => {
    clients.forEach((e) => e.orbit.disconnect());
    done();
  });

  describe('constructor', function() {
    it.only('creates an instance', (done) => {
      console.log();
      Promise.all(clients.map((e) => {
        return e.orbit.getSwarmPeers().then((peers) => {
          console.log(`${e.name}'s peers:`);
          peers.forEach((e) => console.log(e));
          console.log();
          assert.equal(peers.length, 2); // passes
          assert.equal(peers[0], '1'); // TODO
          assert.equal(peers[0], '2'); // TODO
        });
      })).then((res) => done())
    });
  });

});
