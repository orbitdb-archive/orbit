'use strict';

const _         = require('lodash')
const OrbitDB   = require('orbit-db');
const Post      = require('ipfs-post');
const IPFS      = require('ipfs');
const multiaddr = require('multiaddr')
const Logger    = require('logplease');
const logger    = Logger.create("get-channel", { color: Logger.Colors.Cyan });
const utils     = require('../src/utils');

// usage: node get-channel.js <username> <channel>
const network = /*'QmaAHGFm78eupEaDFzBfhUL5xn32dbeqn8oU2XCZJTQGBj'; */'localhost:3333'
const username = process.argv[2] ? process.argv[2] : 'testrunner';
const password = '';
const channelName = process.argv[3] ? process.argv[3] : 'c1';

logger.info(`GET CHANNEL ${channelName} as ${username}`)

let ipfs, db;
let run = (() => {
  return utils.ipfsDaemon(IPFS, '/ip4/0.0.0.0/tcp/7002/ws', '/tmp/orbit-2')
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
    // .then(() => new Promise((resolve, reject) => {
    //   // TODO: make dynamic
    //   ipfs.libp2p.swarm.connect(
    //     // '/ip4/127.0.0.1/tcp/6002/ws/ipfs/QmYJtjAG4wNJB3rDf5kC8T7GGvp1EKyAVu8uJQ7SYo6Y2Y',
    //     // '/ip4/127.0.0.1/tcp/5002/ws/ipfs/QmXyFxpmbDddQ5hi4UEtb7d8raLdzPQunoHe3MwSSAyJoP',
    //     '/ip4/127.0.0.1/tcp/5002/ws/ipfs/QmXQPVWAsecQFPjEVFSYPKaYSyJGNLENyc6JziE5K3ZqCi',
    //     // '/ip4/127.0.0.1/tcp/6002/ws/ipfs/QmXQPVWAsecQFPjEVFSYPKaYSyJGNLENyc6JziE5K3ZqCi',
    //     // '/ip4/127.0.0.1/tcp/5002/ws/ipfs/QmRU7qzc4nqxLECPFYWRr9yveUmKJjYQKLayQ6q3n6ntFm',
    //     (err) => {
    //       if (err) return reject(err);
    //       resolve();
    //     });
    // }))
    .then(() => OrbitDB.connect(network, username, password, ipfs))
    .then((orbit) => {
      logger.debug("OrbitDB")
      orbit.events.on('load', () => logger.debug("loading history"))
      orbit.events.on('synced', () => {
        logger.debug("ready!")
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
          // process.exit(0);
        });
      });
      return orbit;
    })
    .then((orbit) => orbit.eventlog(channelName))
    .then((res) => db = res)
    .catch((e) => {
      logger.error("error:", e);
      logger.error(e.stack);
      process.exit(1);
    });
})();

module.exports = run;
