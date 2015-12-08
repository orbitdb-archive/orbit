var _             = require('lodash');
var fs            = require('fs');
var path          = require('path');
var EventEmitter  = require('events').EventEmitter;
var async         = require('asyncawait/async');
var await         = require('asyncawait/await');
var Promise       = require('bluebird');
var request       = require('request');
var sqlite3       = require('sqlite3').verbose();
var networkServer = require('./NetworkServerApi');
var ipfsAPI       = require('./ipfs-api-promised');
var utils         = require('./utils');
var encryption    = require('./Encryption');
var logger        = require('./logger');
var LocalCache    = require('./LocalCache');
var MetaInfo      = require('./MetaInfo');
var Message       = require('./Message');
var SignedMessage = require('./SignedMessage');
var Channel       = require('./Channel');
var HashCache     = require('./lib/hash-cache-client');

// TESTING SIGNING
var privkey = fs.readFileSync(path.resolve(utils.getAppPath(), 'keys/private.pem')).toString('ascii');
var pubkey  = fs.readFileSync(path.resolve(utils.getAppPath(), 'keys/public.pem')).toString('ascii');
var events  = new EventEmitter();

/* CHANNEL CACHING */
// TODO: move to its own module (ChannelSystem)
var _cacheTimers  = {};
var _pollInterval = 1000;
var _caching      = false;
var _channels = {};

var startCaching = async ((ipfs, channel, uid, password) => {
  if(!_cacheTimers[channel.name] && !_channels[channel.hash]) {
    logger.debug("Start caching #" + channel.name);
    _cacheTimers[channel.hash] = setInterval(async (() => {
      if(!_channels[channel.hash]) {
        _channels[channel.hash] = true;
        // logger.debug("Poll #" + channel.name);
        var gg      = await (LocalCache.getLatestMessage(channel.hash));
        var head    = await (getChannelHead(ipfs, channel.hash, uid, password))
        var headMsg = await (LocalCache.get(head));
        if(head != null && headMsg.length == 0) {
          var latest = gg ? gg : { key: null };
          logger.debug("There are new messages in #" + channel.name)
          logger.debug("New head is", head)
          if(ipfs == null || ipfs == undefined) {
            logger.error("No IPFS! How did we get here?");
          } else {
            await (getMessagesRecursive2(ipfs, channel.name, uid, password, head, latest.key, 100));
            events.emit("messages", channel.name, { channel: channel.name, head: head });
          }
        }
        _channels[channel.hash] = false;
      }
    }), _pollInterval);
  }
});

var leaveChannel = async ((channel) => {
  if(_cacheTimers[channel]) {
    logger.debug("Stop caching #" + channel);
    clearInterval(_cacheTimers[channel]);
    _cacheTimers[channel] = null;
  }
});

var leaveAllChannels = async (() => {
  if(_cacheTimers.length > 0) logger.debug("Stop caching all channels");
  _.each(Object.keys(_cacheTimers), leaveChannel);
});

var getChannelHead = async ((ipfs, channel, uid, password) => {
  var head = await(client.linkedList(channel, password).head)
  return (head.length == 0) ? null : head.head;
});

var getFromIpfs = async ((ipfs, hash) => {
  if(!ipfs) {
    logger.error("No ipfs, wtf!");
    return null;
  }

  if(!hash)
    return null;

  logger.debug("Fetching object from ipfs", hash);
  var startTime = new Date().getTime();
  var object = await (ipfsAPI.getObject(ipfs, hash)
    .then((result) => {
      logger.debug("                  fetched", hash);
      var endTime = new Date().getTime();
      var ms = endTime - startTime;
      logger.debug("* ipfs.object.get took " + ms + " ms");
      return result;
    })
    .catch((err) => {
      logger.error("Couldn't fetch object " + hash + ":", err);
      return null;
    })
  );

  return object;
});

var getObject = async ((ipfs, hash) => {
  var res = null;
  //TODO: get rid of the double table caching
  var cached = await (LocalCache.get(hash));
  if(cached[0] )
    return JSON.parse(cached[0].value);

  cached = await (LocalCache.getContent(hash));
  if(cached[0])
    return JSON.parse(cached[0].value);

  var message = await (getFromIpfs(ipfs, hash));

  if(message) {
    // decrypt
    var data = JSON.parse(message.Data);
    if(data.content) {
      data.content = encryption.decrypt(data.content, privkey);
      res = JSON.stringify(data);
      message.Data = res;
    }

    res = message;
    await (LocalCache.cacheContent(ipfs, hash, res));
  }

  return res;
});

var getUser = async ((ipfs, hash) => {
  var user = await (ipfsAPI.getObject(ipfs, hash));
  return user ? JSON.parse(user.Data)["user"] : "Anonymous";
});

var publishMessage = async ((ipfs, message) => {
  var startTime = new Date().getTime();

  if(message.content)
    message.content = encryption.encrypt(message.content, privkey);

  var payload = JSON.stringify(message);
  var result  = await (ipfsAPI.putObject(ipfs, payload));

  var endTime = new Date().getTime();
  var ms = endTime - startTime;
  logger.debug("* ipfs.object.put took " + ms + " ms");

  return result.Hash;
});

var publishFile = async ((ipfs, filePath) => {
  if(!fs.existsSync(filePath))
    throw "File not found at '" + filePath + "'";

  var fileHash = await (ipfsAPI.add(ipfs, filePath));

  // FIXME: ipfs-api returns an empty dir name as the last hash, ignore this
  if(fileHash[fileHash.length-1].Name === '')
    return fileHash[fileHash.length-2].Hash;

  return fileHash[fileHash.length-1].Hash;
});


var sendToChannel = async ((ipfs, message, uid, readPassword, writePassword, channelName, type, size) => {
  var startTime1 = new Date().getTime();
  var channel = new Channel(channelName, readPassword);
  logger.debug("Sending message...");

  var head    = await (getChannelHead(ipfs, channel.hash, uid, readPassword));
  var headMsg = await (getObject(ipfs, head));

  var seq = 1;
  if(headMsg) {
    var headMessageData = JSON.parse(headMsg.Data);
    seq = headMessageData.seq + 1;
  }

  var hash     = await (publishMessage(ipfs, message));
  var payload  = new MetaInfo(hash, type, size, uid, message.ts);
  var msg      = new SignedMessage(seq, payload, pubkey, privkey, readPassword);
  var metaData = JSON.stringify(msg);

  var meta = await (ipfsAPI.putObject(ipfs, metaData));
  logger.debug("--- Message -------------------------------------------");
  logger.debug("To:      #" + channel.hash);
  logger.debug("Message: '" + encryption.decrypt(message.content, privkey) + "'");
  logger.debug("Hash:    " + hash);
  logger.debug("Meta:    " + meta.Hash);
  logger.debug("-------------------------------------------------------");

  try {
    var newHead = { Hash: meta.Hash };
    if(head)
      newHead = await (ipfsAPI.patchObject(ipfs, meta.Hash, head))

    var startTime = new Date().getTime();
    await(client.linkedList(channel.hash, readPassword).add(newHead.Hash))
    var endTime = new Date().getTime();
    var ms = endTime - startTime;
    logger.debug("* linkedList.add took " + ms + " ms");
    events.emit("messages", channel.name, { head: newHead });
    logger.debug("Message sent!");
  } catch(e) {
    logger.error("Couldn't send the message -", e);
  }

  var endTime1 = new Date().getTime();
  var ms1 = endTime1 - startTime1;
  logger.debug("* send message took " + ms1 + " ms");

  return meta.Hash;
});

var sendMessage = async ((ipfs, text, channel, uid, readPassword, writePassword) => {
  var message = new Message(text, null);
  var result  = await (sendToChannel(ipfs, message, uid, readPassword, writePassword, channel, "msg", new Buffer(text).length));
  return result;
});

var addFile = async ((ipfs, filePath, channel, uid, readPassword, writePassword) => {
  logger.info("Adding file from path '" + filePath + "'");
  var isDirectory = await (utils.isDirectory(filePath));
  var fileHash    = await (publishFile(ipfs, filePath));
  var size        = await (utils.getFileSize(filePath));
  var message     = new Message(filePath.split("/").pop(), fileHash);
  var result      = await (sendToChannel(ipfs, message, uid, readPassword, writePassword, channel, isDirectory ? "list" : "file", size));
  logger.info("Added local file '" + filePath + "' as " + fileHash);
  return result;
});

// WIP
var getMessagesRecursive2 = async ((ipfs, channelName, uid, password, hash, lastHash, amount, curDepth) => {
  var res = [];
  var channel = new Channel(channelName, password);

  if(!curDepth)
    curDepth = 0;

  if(hash == null)
    hash = await (getChannelHead(ipfs, channel.hash, uid, password));

  if(hash == null)
    return res;

  if(curDepth >= amount || (lastHash != null && hash == lastHash))
    return res;

  curDepth ++;

  var message = null;
  var cached  = await (LocalCache.get(hash));

  if(cached[0])
    message = JSON.parse(cached[0].value);
  else {
    message = await (getFromIpfs(ipfs, hash));
    if(message) {
      var data2 = message.Data ? JSON.parse(message.Data) : null;
      data2.payload = JSON.parse(encryption.decrypt(data2.payload, privkey));
      var m = _.cloneDeep(message);
      m.Data = data2;
      if(m) events.emit("message", channel.name, m);
    }
  }

  if(message) {
    var data = message.Data ? JSON.parse(message.Data) : null;
    data.payload = JSON.parse(encryption.decrypt(data.payload, privkey));
    var seq = data.seq;
    var ts   = data ? data.payload.ts : 0;

    if(!cached[0])
      await (LocalCache.cacheMessage(ipfs, channel, hash, message, ts));

    res.push({ hash: hash, data: data.payload, ts: ts, seq: seq });

    if(message.Links.length > 0) {
      var children = await (getMessagesRecursive2(ipfs, channel.hash, uid, password, message.Links[0].Hash, lastHash, amount, curDepth));
      res = res.concat(children);
    }
  }

  return res;
});

var connectToSwarm = async((ipfs, user, peers) => {
  logger.debug("Connecting to " + peers.length + " peers");
  var connectedPeers = 0;
  var res = peers.map((peer) => {
    try {
      await (ipfsAPI.swarmConnect(ipfs, peer));
      connectedPeers += 1;
    } catch(e) {
      /* Ignore, catches 'couldn't connect to peer' errors */
    }
  })
  logger.debug("Connected to " + connectedPeers + " / " + peers.length + " peers");
  return;
});

process.on('uncaughtException', (reason, srcPromise) => {
  logger.warn("-- Uncaught Exception: ", reason);
});

/* PUBLIC API */
var networkInfo;
var client;
var networkAPI = {
  events: events,
  register: (network, username, password) => {
    return new Promise((resolve, reject) => {
      logger.info("Registering to network '" + network + "' as '" + username + "'");
      HashCache.connect(network, username, password)
        .then((result) => {
          client = result;
          networkInfo = client.network;
          resolve(networkInfo);
        })
        .catch(reject)
    });
  },
  joinChannel: (ipfs, channel, uid, password) => {
    return new Promise((resolve, reject) => {
      var c = new Channel(channel, password);
      logger.debug("Join #" + c.name, c.hash);
      client.linkedList(c.hash, c.password).head
        .then((res) => {
          startCaching(ipfs, c, uid, password);
          resolve(res);
        })
        .catch((err) => reject(err))
    });
  },
  leaveChannel: (channel) => {
    return leaveChannel(channel);
  },
  leaveAllChannels: () => {
    return leaveAllChannels();
  },
  addFile: (ipfs, filePath, channel, uid, readPassword, writePassword) => {
    return addFile(ipfs, filePath, channel, uid, readPassword, writePassword);
  },
  sendMessage: (ipfs, message, channel, uid, readPassword, writePassword) => {
    return sendMessage(ipfs, message, channel, uid, readPassword, writePassword);
  },
  getObject: (ipfs, hash) => {
    return getObject(ipfs, hash);
  },
  getUser: (ipfs, hash) => {
    return getUser(ipfs, hash);
  },
  getMessages: (ipfs, channel, uid, password, hash, lastHash, amount) => {
    return getMessagesRecursive2(ipfs, channel, uid, password, hash, lastHash, amount);
  },
  setChannelMode: (ipfs, channel, uid, password, modes) => {
    return new Promise((resolve, reject) => {
      var c = new Channel(channel, password);
      logger.debug("Set mode #" + c.name, c.hash, modes);
      client.linkedList(c.hash, c.password).setMode(modes)
        .then(resolve)
        .catch((err) => reject(err.toString()))
    });
  },
  getChannelInfo: (ipfs, channel, uid) => {
    return networkServer.getChannelInfo(channel, uid);
  },
  connectToSwarm: (ipfs, user, peers) => {
    return connectToSwarm(ipfs, user, peers);
  }
}

module.exports = networkAPI;
