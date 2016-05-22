'use strict';

const _       = require('lodash');
const fs      = require('fs');
const path    = require('path');
const assert  = require('assert');
const ipfsd   = require('ipfsd-ctl');
const IPFS    = require('ipfs')
// const OrbitDB = require('../src/OrbitDB');
const OrbitServer = require('orbit-server/src/server');
const Orbit = require('../src/Orbit');

// Mute logging
require('logplease').setLogLevel('ERROR');

// Orbit
const network = 'Qmeh6ktQ1YFKksugJb59vBxG51xXoEvjBZXRK3DdrF3mNj';
const username = 'testrunner';
const password = '';

let ipfs, ipfsDaemon;
const IpfsApis = [
{
  // js-ipfs
  start: () => {
    return new Promise((resolve, reject) => {
      const ipfs = new IPFS('/tmp/orbit-tests');
      ipfs.init({}, (err) => {
        if(err) {
          if(err.message === 'repo already exists')
            return resolve(ipfs);
          return reject(err);
        }
        ipfs.goOnline((err) => {
          if(err) reject(err)
          resolve(ipfs)
        });
      });
    });
  },
  // stop: () => Promise.resolve()
  stop: () => new Promise((resolve, reject) => {
    if(!ipfs._bitswap && !ipfs._libp2pNode)
      resolve();
    ipfs.goOffline((err) => {
      if(err) console.log("Error", err)
      resolve();
    })
  })
},
// {
//   // js-ipfs-api via local daemon
//   start: () => {
//     return new Promise((resolve, reject) => {
//       ipfsd.disposableApi((err, ipfs) => {
//         if(err) console.error(err);
//         resolve(ipfs);
//       });
//       // ipfsd.local((err, node) => {
//       //   if(err) reject(err);
//       //   ipfsDaemon = node;
//       //   ipfsDaemon.startDaemon((err, ipfs) => {
//       //     if(err) reject(err);
//       //     resolve(ipfs);
//       //   });
//       // });
//     });
//   },
//   stop: () => Promise.resolve()
//   // stop: () => new Promise((resolve, reject) => ipfsDaemon.stopDaemon(resolve))
// }
];

// OrbitServer.start();

IpfsApis.forEach(function(ipfsApi) {

  describe('Orbit', function() {
    this.timeout(1000);

    let orbit, client, client2;
    let channel = 'orbit-test';
    const cacheFile = path.join(process.cwd(), '/test', 'orbit-db-test-cache.json');

    before(function (done) {
      ipfsApi.start()
        .then((res) => {
          ipfs = res;
          done();
        })
        .catch((e) => {
          console.log(e.stack);
          assert.equal(e, null);
          done();
        });
    });

    after((done) => {
      // if(client) client.disconnect();
      // if(client2) client2.disconnect();
      ipfsApi.stop()
        .then(done)
        .catch((e) => {
          console.log(e.stack);
          assert.equal(e, null);
        });
    });

    describe('constructor', function() {
      it('creates an instance', (done) => {
        orbit = new Orbit(ipfs);
        assert.notEqual(orbit, null);
        assert.notEqual(orbit.ipfs, null);
        assert.equal(orbit.orbitdb, null);
        assert.notEqual(orbit.options.dataPath, null);
        assert.notEqual(orbit.options.cacheFile, null);
        assert.equal(Object.keys(orbit._channels).length, 0);
        done();
      });
    });

    describe('connect', function() {
      it('connects to a network', () => {
        orbit = new Orbit(ipfs);
        return orbit.connect(network, username, password)
          .then((res) => {
            assert.notEqual(orbit.orbitdb, null);
            assert.equal(orbit.orbitdb.events.listenerCount('data'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('load'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('ready'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('sync'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('synced'), 1);
          })
      });

      // Uncomment when
      // it('handles connection error', (done) => {
      //   orbit = new Orbit(ipfs);
      //   return orbit.connect('abc', username, password)
      //     .catch((e) => {
      //       assert.notEqual(e, null);
      //       assert.equal(orbit.orbitdb, null);
      //       assert.equal(e.message, 'Invalid Key');
      //       done();
      //     })
      // });

      it('emits \'network\' event when connected to a network', (done) => {
        orbit = new Orbit(ipfs);
        orbit.events.on('network', (networkInfo) => {
          assert.notEqual(networkInfo, null);
          assert.equal(networkInfo.name, 'localhost dev network');
          assert.equal(networkInfo.publishers.length, 1);
          assert.equal(networkInfo.publishers[0], 'localhost:3333');
          done();
        });
        return orbit.connect(network, username, password)
      });
    });

    describe('disconnect', function() {
      it('disconnects from a network', () => {
        orbit = new Orbit(ipfs);
        return orbit.connect(network, username, password)
          .then((res) => {
            orbit.disconnect();
            assert.equal(orbit.orbitdb, null);
            assert.equal(_.isEqual(orbit._channels, {}), true);
          });
      });

      it('emits \'network\' event when disconnected from a network', (done) => {
        orbit = new Orbit(ipfs);
        return orbit.connect(network, username, password)
          .then(() => {
            orbit.events.on('network', (networkInfo) => {
              assert.equal(networkInfo, null);
              done();
            });
          })
          .then(() => orbit.disconnect());
      });
    });

    describe('join', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs);
        orbit.connect(network, username, password).then(done)
      });

      it('joins a new channel', (done) => {
        const channel = "test1";
        return orbit.join(channel).then((channels) => {
          assert.equal(channels.length, 1);
          assert.equal(channels[0].name, channel);
          assert.equal(channels[0].password, null);
          assert.notEqual(channels[0].db, null);
          assert.equal(channels[0].state.loading, false);
          assert.equal(channels[0].state.syncing, true);
          assert.notEqual(orbit._channels[channel], null);
          done();
        }).catch(done);
      });

      it('joins an existing channel', (done) => {
        const channel = "test1";
        return orbit.join(channel)
          .then(() => orbit.join(channel))
          .then((channels) => {
            assert.equal(channels.length, 1);
            assert.equal(channels[0].name, channel);
            assert.equal(channels[0].password, null);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, true);
            done();
          }).catch(done);
      });

      it('joins another new channel', (done) => {
        const channel1 = "test1";
        const channel2 = "test2";
        return orbit.join(channel1)
          .then(() => orbit.join(channel2))
          .then((channels) => {
            assert.equal(channels.length, 2);
            assert.equal(channels[0].name, channel1);
            assert.equal(channels[0].password, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, true);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[1].name, channel2);
            assert.equal(channels[1].password, null);
            assert.equal(channels[1].state.loading, false);
            assert.equal(channels[1].state.syncing, true);
            assert.notEqual(channels[1].db, null);
            done();
          }).catch(done);
      });

      it('emits \'channels.update\' event after joining a new channel', (done) => {
        const channel = "test1";
        orbit.events.once('channels.updated', (channels) => {
          assert.equal(channels.length, 1);
          assert.equal(channels[0].name, channel);
          assert.equal(channels[0].password, null);
          assert.notEqual(channels[0].db, null);
          assert.equal(channels[0].state.loading, false);
          assert.equal(channels[0].state.syncing, true);
          assert.notEqual(orbit._channels[channel], null);
          done();
        });
        orbit.join(channel).catch(done);
      });

      it('emits \'channels.updated\' event after joining an existing channel', (done) => {
        const channel = "test1";
        return orbit.join(channel).then(() => {
          orbit.events.on('channels.updated', (channels) => {
            assert.equal(channels[0].name, channel);
            assert.equal(channels[0].password, null);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, true);
            assert.notEqual(orbit._channels[channel], null);
            assert.equal(channels.length, 1);
            done();
          });
          orbit.join(channel);
        }).catch(done);
      });
    });

    describe('leave', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs);
        orbit.connect(network, username, password).then(done)
      });

      it('leaves a channel', (done) => {
        const channel = "test1";
        return orbit.join(channel).then(() => {
          const channels = orbit.leave(channel);
          assert.equal(channels.length, 0);
          assert.equal(orbit._channels[channel], null);
          done();
        }).catch(done);
      });

      it('emits \'channels.updated\' event after leaving channel', (done) => {
        const channel = "test1";
        return orbit.join(channel).then(() => {
          orbit.events.on('channels.updated', (channels) => {
            assert.equal(channels.length, 0);
            assert.equal(orbit._channels[channel], null);
            done();
          });
          const channels = orbit.leave(channel);
        }).catch(done);
      });
    });

  });
});
