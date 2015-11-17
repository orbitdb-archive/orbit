'use strict';

var path    = require('path');
var async   = require('asyncawait/async');
var await   = require('asyncawait/await');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3').verbose();
var ipfsAPI = require('./ipfs-api-promised');
var utils   = require('./utils');

var databaseFile = path.resolve(utils.getAppPath(), 'cache.db');
var db           = new sqlite3.Database(databaseFile);

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS messages (channel varchar(64), key varhchar(64), value text, ts bigint, PRIMARY KEY (key))");
  db.run("CREATE TABLE IF NOT EXISTS content (hash varchar(64), value text, PRIMARY KEY (hash))");
});

var put = async ((channel, key, value, ts) => {
  var query = Promise.promisify((channel, key, value, ts, cb) => {
    db.serialize(() => {
      db.all("UPDATE messages SET channel='"+channel+"', key='"+key+"', value='"+value+"', ts='"+ts+"' WHERE key='"+key+"'", (err, rows) => {
        db.all("INSERT OR IGNORE INTO messages VALUES('"+channel+"','"+key+"','"+value+"','"+ts+"')", cb);
      });
    })
  });
  return query(channel, key, value, ts);
});

var putContent = async ((hash, value) => {
  var query = Promise.promisify((hash, value, cb) => {
    db.serialize(() => {
      db.all("UPDATE content SET hash='"+hash+"', value='"+value+"'", (err, rows) => {
        db.all("INSERT OR IGNORE INTO content VALUES('"+hash+"','"+value+"')", cb);
      });
    });
  });
  return query(hash, value);
});

var getLatestCachedMessage = async ((channel) => {
  var query = Promise.promisify((channel, cb) => {
    db.serialize(() => {
      db.all("SELECT * FROM messages WHERE channel='"+channel+"' ORDER BY ts DESC LIMIT 1", cb);
    });
  });
  var res = await (query(channel));
  return res.length > 0 ? res[0] : null;
});

var get = async ((hash) => {
  var query = Promise.promisify((hash, cb) => {
    db.serialize(() => {
      db.all("SELECT * FROM messages WHERE key='"+hash+"'", cb);
    })
  });
  return query(hash);
});

var getContentFromCache = async ((hash) => {
  var query = Promise.promisify((hash, cb) => {
    db.serialize(() => {
      db.all("SELECT * FROM content WHERE hash='"+hash+"'", cb);
    });
  });
  return query(hash);
});

var cacheMessage = async ((ipfs, channel, hash, content, ts) => {
  await (put(channel, hash, JSON.stringify(content), ts));
  ipfsAPI.pinObject(ipfs, hash).catch((e) => { /* ignore */ });
  return;
});

var cacheContent = async ((ipfs, hash, content) => {
  await (putContent(hash, JSON.stringify(content).replace(/\'/g, "''")));
  ipfsAPI.pinObject(ipfs, hash).catch((e) => { /* ignore */ });
  return;
});

module.exports = {
  cacheMessage: (ipfs, channel, hash, content, ts) => {
    return cacheMessage(ipfs, channel, hash, content, ts);
  },
  cacheContent: (ipfs, hash, content) => {
    return cacheContent(ipfs, hash, content);
  },
  get: (hash) => {
    return get(hash);
  },
  getContent: (hash) => {
    return getContentFromCache(hash);
  },
  getLatestMessage: (channel) => {
    return getLatestCachedMessage(channel);
  }
};
