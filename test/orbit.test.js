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
const EventStore = require('orbit-db-eventstore');
const Post         = require('ipfs-post');

// Mute logging
// require('logplease').setLogLevel('ERROR');

// Orbit
const network = 'localhost:3333';
const username = 'testrunner';
const password = '';

let ipfs, ipfsDaemon;
const IpfsApis = [
{
  // js-ipfs
  name: 'js-ipfs',
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
{
  // js-ipfs-api via local daemon
  name: 'js-ipfs-api',
  start: () => {
    return new Promise((resolve, reject) => {
      ipfsd.disposableApi((err, ipfs) => {
        if(err) reject(err);
        resolve(ipfs);
      });
      // ipfsd.local((err, node) => {
      //   if(err) reject(err);
      //   ipfsDaemon = node;
      //   ipfsDaemon.startDaemon((err, ipfs) => {
      //     if(err) reject(err);
      //     resolve(ipfs);
      //   });
      // });
    });
  },
  stop: () => Promise.resolve()
  // stop: () => new Promise((resolve, reject) => ipfsDaemon.stopDaemon(resolve)) // for use with local daemon
}
];

OrbitServer.start();

IpfsApis.forEach(function(ipfsApi) {

  describe('Orbit with ' + ipfsApi.name, function() {
    if(ipfsApi.name === 'js-ipfs')
      this.timeout(10000);
    else
      this.timeout(40000);

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
      if(orbit)
        orbit.disconnect();

      if(ipfs) {
        ipfsApi.stop()
          .then(done)
          .catch((e) => {
            console.log(e.stack);
            assert.equal(e, null);
          });
      }
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
      it('connects to a network', (done) => {
        orbit = new Orbit(ipfs);
        return orbit.connect(network, username, password)
          .then((res) => {
            assert.notEqual(orbit.orbitdb, null);
            assert.equal(orbit.orbitdb.events.listenerCount('data'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('load'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('ready'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('sync'), 1);
            assert.equal(orbit.orbitdb.events.listenerCount('synced'), 1);
            orbit.disconnect();
            return done();
          })
          .catch(done)
      });

      it('handles connection error', () => {
        orbit = new Orbit(ipfs);
        return orbit.connect('abc', username, password)
          .catch((e) => {
            assert.notEqual(e, null);
            assert.equal(orbit.orbitdb, null);
            // assert.equal(e.message, 'Invalid Key'); // js-ipfs
            assert.equal(e.message, "Connection refused to Pubsub at 'abc:undefined'"); // js-ipfs-api
          })
      });

      it('emits \'network\' event when connected to a network', (done) => {
        orbit = new Orbit(ipfs);
        orbit.events.on('network', (networkInfo) => {
          assert.notEqual(networkInfo, null);
          // assert.equal(networkInfo.name, 'localhost dev network');
          assert.equal(networkInfo.publishers.length, 1);
          // assert.equal(networkInfo.publishers[0], 'localhost:3333');
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
          })
      });

      it('emits \'network\' event when disconnected from a network', (done) => {
        orbit = new Orbit(ipfs);
        orbit.connect(network, username, password)
          .then(() => {
            orbit.events.on('network', (networkInfo) => {
              assert.equal(networkInfo, null);
              done();
            });
          })
          .then(() => orbit.disconnect())
          .catch(done)
      });
    });

    describe('join', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs, { cacheFile: null });
        orbit.connect(network, username, password)
          .then((res) => done())
          .catch(done)
      });

      afterEach(() => {
        orbit.disconnect();
      });

      it('joins a new channel', () => {
        const channel = 'test1';
        return orbit.join(channel).then((channels) => {
          assert.equal(channels.length, 1);
          assert.equal(channels[0].name, channel);
          assert.equal(channels[0].password, null);
          assert.notEqual(channels[0].db, null);
          assert.equal(channels[0].state.loading, false);
          assert.equal(channels[0].state.syncing, 0);
          assert.notEqual(orbit._channels[channel], null);
        });
      });

      it('joins an existing channel', () => {
        const channel = 'test1';
        return orbit.join(channel)
          .then(() => orbit.join(channel))
          .then((channels) => {
            assert.equal(channels.length, 1);
            assert.equal(channels[0].name, channel);
            assert.equal(channels[0].password, null);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, 0);
          });
      });

      it('joins another new channel', () => {
        const channel1 = 'test1';
        const channel2 = 'test2';
        return orbit.join(channel1)
          .then(() => orbit.join(channel2))
          .then((channels) => {
            assert.equal(channels.length, 2);
            assert.equal(channels[0].name, channel1);
            assert.equal(channels[0].password, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, 0);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[1].name, channel2);
            assert.equal(channels[1].password, null);
            assert.equal(channels[1].state.loading, false);
            assert.equal(channels[1].state.syncing, 0);
            assert.notEqual(channels[1].db, null);
          });
      });

      it('emits \'channels.update\' event after joining a new channel', (done) => {
        const channel = 'test1';
        orbit.events.once('channels.updated', (channels) => {
          assert.equal(channels.length, 1);
          assert.equal(channels[0].name, channel);
          assert.equal(channels[0].password, null);
          assert.notEqual(channels[0].db, null);
          assert.equal(channels[0].state.loading, false);
          assert.equal(channels[0].state.syncing, 0);
          assert.notEqual(orbit._channels[channel], null);
          done();
        });
        orbit.join(channel).catch(done);
      });

      it('emits \'channels.updated\' event after joining an existing channel', (done) => {
        const channel = 'test1';
        orbit.join(channel).then(() => {
          orbit.events.on('channels.updated', (channels) => {
            assert.equal(channels[0].name, channel);
            assert.equal(channels[0].password, null);
            assert.notEqual(channels[0].db, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, 0);
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
        orbit = new Orbit(ipfs, { cacheFile: null });
        orbit.connect(network, username, password)
          .then((res) => done())
          .catch(done)
      });

      it('leaves a channel', () => {
        const channel = 'test1';
        return orbit.join(channel).then(() => {
          const channels = orbit.leave(channel);
          assert.equal(channels.length, 0);
          assert.equal(orbit._channels[channel], null);
        });
      });

      it('emits \'channels.updated\' event after leaving channel', () => {
        const channel = 'test1';
        return orbit.join(channel).then(() => {
          orbit.events.on('channels.updated', (channels) => {
            assert.equal(channels.length, 0);
            assert.equal(orbit._channels[channel], null);
          });
          const channels = orbit.leave(channel);
        });
      });

      it('emits \'channels.updated\' event after calling leave if channels doesn\'t exist', () => {
        const channel = 'test1';
        orbit.events.on('channels.updated', (channels) => {
          assert.equal(channels.length, 0);
          assert.equal(orbit._channels[channel], null);
        });
        orbit.leave(channel);
      });
    });

    describe('getters', function() {
      describe('return', function() {
        before((done) => {
          orbit = new Orbit(ipfs, { cacheFile: null });
          orbit.connect(network, username, password)
            .then((res) => done())
            .catch(done)
        });

        after(() => {
          orbit.disconnect();
        });

        it('user', () => {
          assert.notEqual(orbit.user, null);
          assert.equal(orbit.user.username, username);
          assert.equal(orbit.user.id, username);
        });

        it('network', () => {
          assert.notEqual(orbit.network, null);
          // assert.equal(orbit.network.name, 'localhost dev network');
          assert.equal(orbit.network.publishers.length, 1);
          // assert.equal(orbit.network.publishers[0], 'localhost:3333');
        });

        it('channels', () => {
          const channel = 'test2';
          return orbit.join(channel).then(() => {
            assert.equal(orbit.channels.length, 1);
            assert.equal(orbit.channels[0].name, channel);
            assert.equal(orbit.channels[0].name, channel);
          })
        });
      });

      describe('defaults', function() {
        before(() => {
          orbit = new Orbit(ipfs, { cacheFile: null });
        });

        it('no users', () => {
          assert.equal(orbit.user, null);
        });
        it('no network', () => {
          assert.equal(orbit.network, null);
        });
        it('no channels', () => {
          assert.equal(orbit.channels.length, 0);
        });
      });
    });

    describe('getChannels', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs, { cacheFile: null });
        orbit.connect(network, username, password)
          .then((res) => done())
          .catch(done)
      });

      afterEach(() => {
        orbit.disconnect();
      });

      it('returns no channels', () => {
        assert.equal(orbit.getChannels().length, 0);
      });

      it('returns one channel after join', () => {
        const channel = 'test1';
        return orbit.join(channel).then((channels) => {
          assert.equal(orbit.getChannels().length, 1);
        });
      });

      it('has a callback', () => {
        const channel = 'test1';
        return orbit.join(channel).then((channels) => {
          orbit.getChannels((channels) => {
            assert.equal(channels.length, 1);
          });
        });
      });

      it('returns the channels in the correct format', () => {
        const channel = 'test1';
        return orbit.join(channel).then(() => {
          const channels = orbit.getChannels();
          assert.equal(channels[0].name, channel);
          assert.equal(channels[0].password, null);
          assert.equal(Object.prototype.isPrototypeOf(channels[0].db, EventStore), true);
        });
      });
    });

    describe('sendMessage', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs, { cacheFile: null });
        orbit.connect(network, username, password)
          .then((res) => done())
          .catch(done)
      });

      afterEach(() => {
        orbit.disconnect();
      });

      it('returns a Post', (done) => {
        const channel = 'test1';
        const content = 'hello1';
        return orbit.join(channel)
          .then(() => orbit.sendMessage(channel, content))
          .then((message) => {
            setTimeout(() => {
              assert.notEqual(message.Post, null);
              assert.equal(message.Hash.startsWith('Qm'), true);
              assert.equal(message.Post.content, content);
              assert.equal(message.Post.meta.type, "text");
              assert.equal(message.Post.meta.size, 15);
              assert.notEqual(message.Post.meta.ts, null);
              assert.equal(message.Post.meta.from, username);
              done();
            }, 1000);
          });
      });

      it('has a callback', (done) => {
        const channel = 'test1';
        const content = 'hello1';
        orbit.join(channel).then(() => {
          orbit.sendMessage(channel, content, (err, message) => {
            setTimeout(() => {
              assert.notEqual(message.Post, null);
              assert.equal(message.Hash.startsWith('Qm'), true);
              assert.equal(message.Post.content, content);
              assert.equal(message.Post.meta.type, "text");
              assert.equal(message.Post.meta.size, 15);
              assert.notEqual(message.Post.meta.ts, null);
              assert.equal(message.Post.meta.from, username);
              done();
            }, 1000);
          });
        });
      });

      it('Post was added to IPFS', (done) => {
        const channel = 'test1';
        const content = 'hello1';
        return orbit.join(channel)
          .then(() => orbit.sendMessage(channel, content))
          .then((message) => orbit.getPost(message.Hash))
          .then((data) => {
            assert.equal(data.content, content);
            assert.equal(data.meta.type, "text");
            assert.equal(data.meta.size, 15);
            assert.notEqual(data.meta.ts, null);
            assert.equal(data.meta.from, username);
            done();
          });
      });

      it('sends a message to a channel', () => {
        const channel = 'test1';
        const content = 'hello1';
        return orbit.join(channel)
          .then(() => orbit.sendMessage(channel, content))
          .then((message) => {
            const messages = orbit.getMessages(channel);
            assert.equal(messages.length, 1);
            assert.equal(messages[0].payload.op, 'ADD');
            assert.equal(messages[0].payload.value, message.Hash);
            assert.notEqual(messages[0].payload.meta, null);
            assert.notEqual(messages[0].payload.meta.ts, null);
            assert.equal(messages[0].hash.startsWith('Qm'), true);
            assert.equal(messages[0].next.length, 0);
          });
      });


    });

    // describe('getMessages', function() {
    //   beforeEach((done) => {
    //     orbit = new Orbit(ipfs);
    //     orbit.connect(network, username, password).then(done)
    //   });

    //   afterEach(() => {
    //     orbit.disconnect();
    //   });

    //   it('returns one channel after join', () => {
    //     const channel = 'test1';
    //     return orbit.join(channel).then((channels) => {
    //       assert.equal(orbit.getChannels().length, 1);
    //     });
    //   });

    //   it('has a callback', () => {
    //     const channel = 'test1';
    //     return orbit.join(channel).then((channels) => {
    //       orbit.getChannels((channels) => {
    //         assert.equal(channels.length, 1);
    //       });
    //     });
    //   });

    //   it('returns the channels in the correct format', () => {
    //     const channel = 'test1';
    //     return orbit.join(channel).then(() => {
    //       const channels = orbit.getChannels();
    //       assert.equal(channels[0].name, channel);
    //       assert.equal(channels[0].password, null);
    //       assert.equal(Object.prototype.isPrototypeOf(channels[0].db, EventStore), true);
    //     });
    //   });
    // });

    describe('event handling', function() {
      beforeEach((done) => {
        orbit = new Orbit(ipfs, { cacheFile: null });
        orbit.connect(network, username, password)
          .then((res) => done())
          .catch(done)
      });

      afterEach(() => {
        orbit.disconnect();
      });

      it('emits \'data\'', (done) => {
        const channel = 'test1';
        orbit.events.on('data', (channelName, messageHash) => {
          assert.equal(channelName, channel);
          assert.equal(messageHash.startsWith('Qm'), true);
          done();
        });
        orbit.join(channel).then(() => orbit.sendMessage(channel, 'hello'));
      });

      it('emits \'load\'', (done) => {
        const channel = 'test1';
        orbit.events.on('load', (channelName) => {
          assert.equal(channelName, channel);
          done();
        });
        orbit.join(channel);
      });

      it('emits \'state.updated\' on load', (done) => {
        const channel = 'test1';
        orbit.events.once('state.updated', (channels) => {
          assert.equal(channels.length, 1);
          assert.equal(channels[0].db, null);
          assert.equal(channels[0].state.loading, true);
          assert.equal(channels[0].state.syncing, 0);
          done();
        });
        orbit.join(channel);
      });

      it('emits \'ready\'', (done) => {
        const channel = 'test1';
        orbit.events.on('ready', (channelName) => {
          assert.equal(channelName, channel);
          done();
        });
        orbit.join(channel);
      });

      it('emits \'state.updated\' on ready', (done) => {
        const channel = 'test1';
        orbit.events.on('ready', () => {
          orbit.events.on('state.updated', (channels) => {
            assert.equal(channels.length, 1);
            assert.equal(channels[0].db, null);
            assert.equal(channels[0].state.loading, false);
            assert.equal(channels[0].state.syncing, 0);
            done();
          });
        });
        orbit.join(channel);
      });

      it('emits \'sync\' on load', (done) => {
        const channel = 'test1';
        orbit.events.on('sync', (channelName) => {
          assert.equal(channelName, channel);
          done();
        });
        orbit.join(channel);
      });

      it('emits \'state.updated\' on sync', (done) => {
        const channel = 'test1';
        orbit.join(channel)
          .then(() => {
            orbit.events.removeAllListeners('state.updated');
            orbit.events.on('sync', (channelName) => {
              orbit.events.on('state.updated', (channels) => {
                assert.equal(channels.length, 1);
                assert.notEqual(channels[0].db, null);
                assert.equal(channels[0].state.loading, false);
                assert.equal(channels[0].state.syncing, 1);
                done();
              });
            });
          });
      });

      it('emits \'sync\'', (done) => {
        const channel = 'test1';
        orbit.join(channel).then(() => {
          orbit.events.on('sync', (channelName) => {
            assert.equal(channelName, channel);
            done();
          });
        });
      });

      it('emits \'state.updated\' on synced', (done) => {
        const channel = 'test1';
        orbit.join(channel).then(() => {
          orbit.events.removeAllListeners('state.updated');
          orbit.events.on('synced', (channelName) => {
            orbit.events.on('state.updated', (channels) => {
              assert.equal(channels.length, 1);
              assert.notEqual(channels[0].db, null);
              assert.equal(channels[0].state.loading, false);
              assert.equal(channels[0].state.syncing, 0);
              done();
            });
          });
        });
      });

      it('emits \'synced\' after sync', (done) => {
        const channel = 'test1';
        orbit.events.on('synced', (channelName) => {
          orbit.events.removeAllListeners('synced');
          orbit.events.on('synced', (channelName, items) => {
            assert.equal(channelName, channel);
            done();
          });
          orbit.sendMessage(channel, 'hello');
        });
        orbit.join(channel);
      });
    });

  });
});
