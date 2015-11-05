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

// TESTING SIGNING
var privkey = fs.readFileSync(path.resolve(process.type ? process.resourcesPath + "/app/" : process.cwd(), 'keys/private.pem')).toString('ascii');
var pubkey  = fs.readFileSync(path.resolve(process.type ? process.resourcesPath + "/app/" : process.cwd(), 'keys/public.pem')).toString('ascii');
var events  = new EventEmitter();

/* CHANNEL CACHING */
// TODO: move to its own module (ChannelSystem)
var _cacheTimers  = {};
var _pollInterval = 1000;
var _caching      = false;

var joinChannel = async ((ipfs, channel, uid, password) => {
  logger.debug("Join channel #" + channel);

  var channelInfo;

  try {
    channelInfo = await (networkServer.joinChannel(channel, uid, encryption.encrypt(password, privkey)));
    if(channelInfo.writePassword) channelInfo.writePassword = encryption.decrypt(channelInfo.writePassword, privkey);
  } catch(e) {
    throw e
  }

  if(!_cacheTimers[channel]) {
    logger.debug("Start caching #" + channel);
    _cacheTimers[channel] = setInterval(async (() => {
      if(!_caching) {
        _caching = true;
        var gg      = await (LocalCache.getLatestMessage(channel));
        var head    = await (getChannelHead(ipfs, channel, uid, password))
        var headMsg = await (LocalCache.get(head));
        if(head != null && headMsg.length == 0) {
          var latest = gg ? gg : { key: null };
          logger.debug("There are new messages in #" + channel)
          logger.debug("New head is", head)
          if(ipfs == null || ipfs == undefined) {
            logger.error("No IPFS! How did we get here?");
          } else {
            await (getMessagesRecursive2(ipfs, channel, uid, password, head, latest.key, 100));
            events.emit("messages", { head: head });
          }
        }
        _caching = false;
      }
    }), _pollInterval);
  }

  return channelInfo;
});

var leaveChannel = async (function(channel) {
  if(_cacheTimers[channel]) {
    logger.debug("Stop caching #" + channel);
    clearInterval(_cacheTimers[channel]);
    _cacheTimers[channel] = null;
  }
});

var leaveAllChannels = async (function() {
  if(_cacheTimers.length > 0) logger.debug("Stop caching all channels");
  _.each(Object.keys(_cacheTimers), leaveChannel);
});

var getChannelHead = async (function(ipfs, channel, uid, password) {
  var head = await (networkServer.getChannel(channel, uid, password))
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
  var object = await (ipfsAPI.getObject(ipfs, hash)
    .then(function(result) {
      logger.debug("                  fetched", hash);
      return result;
    })
    .catch(function(err) {
      logger.error("Couldn't fetch object " + hash + ":", err);
      return null;
    })
  );

  return object;
});

var getObject = async ((ipfs, hash) => {
  var startTime = new Date().getTime();

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

  var endTime = new Date().getTime();
  var ms = endTime - startTime;
  logger.debug("getObject took " + ms + "ms");
  return res;
});

var getUser = async ((ipfs, hash) => {
  var user = await (ipfsAPI.getObject(ipfs, hash));
  return user ? JSON.parse(user.Data)["user"] : "Anonymous";
});

var publishMessage = async ((ipfs, message) => {
  if(message.content)
    message.content = encryption.encrypt(message.content, privkey);

  var payload = JSON.stringify(message);
  var result  = await (ipfsAPI.putObject(ipfs, payload));
  return result.Hash;
});

var publishFile = async (function(ipfs, filePath) {
  if(!fs.existsSync(filePath))
    throw "File not found at '" + filePath + "'";

  var fileHash = await (ipfsAPI.add(ipfs, filePath));

  // FIXME: ipfs-api returns an empty dir name as the last hash, ignore this
  if(fileHash[fileHash.length-1].Name === '')
    return fileHash[fileHash.length-2].Hash;

  return fileHash[fileHash.length-1].Hash;
});


var sendToChannel = async (function(ipfs, message, uid, readPassword, writePassword, channel, type, size) {
  logger.debug("Sending message...");

  var head    = await (getChannelHead(ipfs, channel, uid, readPassword));
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
  logger.debug("To:      #" + channel);
  logger.debug("Message: '" + encryption.decrypt(message.content, privkey) + "'");
  logger.debug("Hash:    " + hash);
  logger.debug("Meta:    " + meta.Hash);
  logger.debug("-------------------------------------------------------");

  try {
    var newHead = { Hash: meta.Hash };
    if(head)
      newHead = await (ipfsAPI.patchObject(ipfs, meta.Hash, head))
    // TODO: pass oldHead too, so the cache can return success/fail
    await (networkServer.updateChannel(channel, newHead.Hash, metaData, uid, writePassword));
    events.emit("messages", { head: newHead });
    logger.debug("Message sent!");
  } catch(e) {
    logger.error(e);
  }

  return meta.Hash;
});

var sendMessage = async (function(ipfs, text, channel, uid, readPassword, writePassword) {
  var message = new Message(text, null);
  var result  = sendToChannel(ipfs, message, uid, readPassword, writePassword, channel, "msg", new Buffer(text).length);
  return result;
});

var addFile = async (function(ipfs, filePath, channel, uid, readPassword, writePassword) {
  logger.info("Adding file from path '" + filePath + "'");
  var isDirectory = await (utils.isDirectory(filePath));
  var fileHash    = await (publishFile(ipfs, filePath));
  var size        = await (utils.getFileSize(filePath));
  var message     = new Message(filePath.split("/").pop(), fileHash);
  var result      = sendToChannel(ipfs, message, uid, readPassword, writePassword, channel, isDirectory ? "list" : "file", size);
  logger.info("Added local file '" + filePath + "' as " + fileHash);
  return result;
});

var register = function(network, username, password) {
  logger.info("Registering to network '" + network + "' as '" + username + "'");
  return Promise.promisify(function(cb) {
    var url = 'http://' + network + '/register';// + username + '/' + encodeURIComponent(password);
    logger.debug("making post to", url);
    request.post({ url: url, form: { "username": username, "password": password } }, (err, res, body) => {
      logger.debug("request done");
      if(!res) {
        logger.error(err);
        cb("Connection refused", null);
      }
      else if(res.statusCode != 200)
        cb(JSON.parse(body).message, null);
      else
        cb(null, body != null ? JSON.parse(body).data : null);
    });
  });
}

// WIP
var getMessagesRecursive2 = async ((ipfs, channel, uid, password, hash, lastHash, amount, curDepth) => {
  var res = [];

  if(!curDepth)
    curDepth = 0;

  if(hash == null)
    hash = await (getChannelHead(ipfs, channel, uid, password));

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
      if(m) events.emit("message", channel, m);
    }
  }

  if(message) {
    var data = message.Data ? JSON.parse(message.Data) : null;
    data.payload = JSON.parse(encryption.decrypt(data.payload, privkey));
    var ts   = data ? data.payload.ts : 0;

    if(!cached[0])
      await (LocalCache.cacheMessage(ipfs, channel, hash, message, ts));

    res.push({ hash: hash, data: data.payload, ts: ts });

    if(message.Links.length > 0) {
      var children = await (getMessagesRecursive2(ipfs, channel, uid, password, message.Links[0].Hash, lastHash, amount, curDepth));
      res = res.concat(children);
    }
  }

  return res;
});

var connectToSwarm = async((ipfs, user, peers) => {
  var res = peers.map((peer) => {
    logger.debug("Connecting to", peer);
    ipfsAPI.swarmConnect(ipfs, peer)
      .then(function(result) {
        logger.debug("Peer", result.Strings[0]);
        //TODO: fire onPeerConnected
        return true;
      })
      .catch(function(err) {
        logger.warn("Couldn't connect to peer:", err);
        return false;
      });
  });
  ipfsAPI.dhtPut(ipfs, user.id, user.username);
  return;
});


/* PUBLIC API */
var networkAPI = {
  events: events,
  register: (network, username, password) => {
    return register(network, username, password);
  },
  joinChannel: (ipfs, channel, uid, password) => {
    return joinChannel(ipfs, channel, uid, password);
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
  // TODO: rename to setChannelInfo
  changeChannelPasswords: (ipfs, channel, uid, password, newReadPassword, newWritePassword) => {
    return networkServer.changePasswords(channel, uid, password, newReadPassword, newWritePassword);
  },
  getChannelInfo: (ipfs, channel, uid) => {
    return networkServer.getChannelInfo(channel, uid);
  },
  connectToSwarm: (ipfs, user, peers) => {
    return connectToSwarm(ipfs, user, peers);
  }
}

module.exports = networkAPI;
