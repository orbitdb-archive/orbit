'use strict';

const OrbitDB   = require('orbit-db');
const Post      = require('ipfs-post');
const IPFS      = require('ipfs')
const multiaddr = require('multiaddr')
const Logger    = require('logplease');
const logger    = Logger.create("send-message", { color: Logger.Colors.Yellow });
const utils     = require('../src/utils');

// usage: send-message.js <username> <channel> <message>
const network = 'QmaAHGFm78eupEaDFzBfhUL5xn32dbeqn8oU2XCZJTQGBj'; // 'localhost:3333'
const username = process.argv[2] ? process.argv[2] : 'testrunner';
const password = '';
const channelName = process.argv[3] ? process.argv[3] : 'c1';
const message = process.argv[4] ? process.argv[4] : 'hello world';

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    const ipfs = new IPFS()
    ipfs.goOnline(() => {
      resolve(ipfs)
    })
  });
};

let ipfs, db;
let run = (() => {
  return utils.ipfsDaemon(IPFS, '/ip4/0.0.0.0/tcp/6002/ws', '/tmp/orbit-2')
    .then((res) => ipfs = res)
    .then(() => {
      return new Promise((resolve, reject) => {
        ipfs.id((err, id) => {
          if (err) return reject(err);
          resolve(id);
        });
      });
    })
    .then((id) => {
      logger.info(`IPFS Node started: ${id.Addresses[0]}/ipfs/${id.ID}`);
      return;
    })
    .then(() => {
      // Wait for browser nodes to connect and dial back when they do
      ipfs._libp2pNode.swarm.on('peer-mux-established', (peerInfo) => {
        const id = peerInfo.id.toB58String();
        logger.debug('node connected', id);
        const addr = peerInfo.multiaddrs
                .filter((addr) => {
                  return _.includes(addr.protoNames(), 'ws');
                })[0];
        let target = addr.encapsulate(multiaddr(`/ipfs/${id}`)).toString()
        target = target.replace('0.0.0.0', '127.0.0.1')

        ipfs.libp2p.swarm.connect(target, (err) => {
          if (err) {
            logger.error('failed to connect to', target, err.message);
            return;
          }
          logger.debug('connected back to', target)
        })
      });
    })
    .then((res) => OrbitDB.connect(network, username, password, ipfs))
    .then((orbit) => {
      logger.debug("OrbitDB")
      orbit.events.on('load', () => logger.debug("loading history"))
      orbit.events.on('synced', () => {
        logger.debug("ready!")
        const data = {
          content: message,
          from: username
        };
        Post.create(ipfs, Post.Types.Message, data)
          .then((post) => {
            return db.add(post.Hash)
          })
          .then(() => {
            let items = db.iterator({ limit: -1 })
              .collect()
              .map((f) => ipfs.object.get(f.payload.value, { enc: 'base58' }))

            Promise.all(items).then((res) => {
              const events = res.map((f) => JSON.parse(f.toJSON().Data));
              logger.info("---------------------------------------------------")
              logger.info("Timestamp | Message | From")
              logger.info("---------------------------------------------------")
              events.map((e) => logger.info(`${e.meta.ts} | ${e.content} | ${e.meta.from}`));
              logger.info("---------------------------------------------------")
              process.exit(0);
            });
          })
          .catch((e) => {
            throw e;
          })
      });
      return orbit;
    })
    .then((orbit) => orbit.eventlog(channelName))
    .then((res) => db = res)
    .catch((e) => {
      logger.error("Error:", e);
      logger.error(e.stack);
      process.exit(1);
    });
})();

module.exports = run;
