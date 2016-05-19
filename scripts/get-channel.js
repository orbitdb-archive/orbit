'use strict';

const async   = require('asyncawait/async');
const await   = require('asyncawait/await');
const OrbitDB = require('orbit-db');
const Post    = require('ipfs-post');
const IPFS    = require('ipfs');
const utils   = require('../src/utils');
const Logger  = require('logplease');
const logger  = Logger.create("GetChannel", { color: Logger.Colors.Green });
const _       = require('lodash')
const multiaddr = require('multiaddr')

// usage: node get-channel.js <username> <channel>
const network = /*'QmaAHGFm78eupEaDFzBfhUL5xn32dbeqn8oU2XCZJTQGBj'; */'localhost:3333'
const username = process.argv[2] ? process.argv[2] : 'testrunner';
const password = '';
const channelName = process.argv[3] ? process.argv[3] : 'c1';

logger.info(`GET CHANNEL ${channelName} as ${username}`)

let ipfs, db;
let run = (async(() => {
  try {
    return utils.ipfsDaemon(IPFS, '/ip4/0.0.0.0/tcp/6002/ws', '/tmp/orbit-2')
      .then((res) => {
        ipfs = res;
      })
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
          logger.info('node connected', id);
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
            logger.info('connected back to', target)
          })
        });
      })
    // .then(() => new Promise((resolve, reject) => {
      //   // TODO: make dynamic
      //   ipfs.libp2p.swarm.connect(
      //     '/ip4/127.0.0.1/tcp/5002/ws/ipfs/QmRU7qzc4nqxLECPFYWRr9yveUmKJjYQKLayQ6q3n6ntFm', (err) => {
      //       if (err) return reject(err);
      //       logger.info('connected to the source')
      //       setTimeout(() => {
      //         resolve();
      //       }, 500);
      //     });
      // }))
      .then(() => OrbitDB.connect(network, username, password, ipfs))
      .then((orbit) => {
        logger.info("OrbitDB")
        orbit.events.on('load', () => logger.info("loading history"))
        orbit.events.on('synced', () => {
          logger.info("ready!")
          let items = db.iterator({ limit: -1 })
            .collect()
            .map((f) => ipfs.object.get(f.payload.value, { enc: 'base58' }))

          Promise.all(items).then((res) => {
            const events = res.map((f) => JSON.parse(f.toJSON().Data));
            logger.info("---------------------------------------------------")
            logger.info("Timestamp | Message | From")
            logger.info("---------------------------------------------------")
            logger.info(events.map((e) => `${e.meta.ts} | ${e.content} | ${e.meta.from}`).join("\n"));
            logger.info("---------------------------------------------------")
            process.exit(0);
          });
        });
        return orbit;
      })
      .then((orbit) => orbit.eventlog(channelName))
      .then((res) => db = res)
      .catch((e) => {
        console.error("error:", e);
        console.error(e.stack);
        process.exit(1);
      })
  } catch(e) {
    console.error(e.stack);
    logger.info("Exiting...")
    process.exit(1);
  }
}))();

module.exports = run;
