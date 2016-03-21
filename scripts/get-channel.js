'use strict';

const async   = require('asyncawait/async');
const await   = require('asyncawait/await');
const OrbitDB = require('orbit-db');

// usage: get-channel.js <host> <username> <channel> <data> <interval in ms>

// orbit-server
const host = process.argv[2] ? process.argv[2] : 'localhost'
const port = 3333;

const username = process.argv[3] ? process.argv[3] : 'LambOfGod';
const password = '';

let run = (async(() => {
  try {
    var orbit = OrbitDB.connect(host, port, username, password);
    const channelName = process.argv[4] ? process.argv[4] : 'test';
    const db = orbit.channel(channelName);

    orbit.events.on('loaded', (channel, hash) => {
        let items = await(db.iterator({ limit: -1 }).collect());
        let values = items.map((f) => {
            const obj = await(orbit._ipfs.object.get(f.value));
            const v = JSON.parse(obj.Data)["content"];
            return { key: f.key, value: v };
        });

        console.log("---------------------------------------------------")
        console.log("Key | Value")
        console.log("---------------------------------------------------")
        console.log(values.map((e) => `${e.key} | ${e.value}`).join("\n"));
        console.log("---------------------------------------------------")
        process.exit(0);
    });
  } catch(e) {
    console.error(e.stack);
    console.log("Exiting...")
    process.exit(1);
  }
}))();

module.exports = run;
