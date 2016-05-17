'use strict';

const async   = require('asyncawait/async');
const await   = require('asyncawait/await');
const OrbitDB = require('orbit-db');
const Post    = require('ipfs-post');
const IPFS    = require('ipfs')

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
let run = (async(() => {
  try {
    startIpfs()
      .then((res) => {
        ipfs = res;
        return OrbitDB.connect(network, username, password, ipfs)
      })
      .then((orbit) => {
        console.log("OrbitDB")
        orbit.events.on('load', () => console.log("loading history"))
        orbit.events.on('synced', () => {
          console.log("ready!")
          const data = {
            content: message,
            from: username
          };
          console.log("1")
          Post.create(ipfs, Post.Types.Message, data)
            .then((post) => {
          console.log("2")
              return db.add(post.Hash)
            })
            .then(() => {
          console.log("3")
              let items = db.iterator({ limit: -1 })
                .collect()
                .map((f) => ipfs.object.get(f.payload.value, { enc: 'base58' }))

              Promise.all(items).then((res) => {
                const events = res.map((f) => JSON.parse(f.toJSON().Data));
                console.log("---------------------------------------------------")
                console.log("Timestamp | Message | From")
                console.log("---------------------------------------------------")
                console.log(events.map((e) => `${e.meta.ts} | ${e.content} | ${e.meta.from}`).join("\n"));
                console.log("---------------------------------------------------")
                process.exit(0);
              });
            })
            .catch((e) => {
              console.log("EEE", e)
              throw e;
            })
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
    console.log("Exiting...")
    process.exit(1);
  }
}))();

module.exports = run;
