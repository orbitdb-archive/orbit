'use strict';

var Base58         = require('bs58');
var crypto         = require('crypto');
var async          = require('asyncawait/async');
var await          = require('asyncawait/await');
var Promise        = require('bluebird');
var express        = require('express');
var app            = express();
var cors           = require('cors');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var mime           = require('mime');
var http           = require('http');

var logger         = require('../logger');
var networkAPI     = require('../network-api');
var ipfsAPI        = require('../ipfs-api-promised');
var ApiMessages    = require('../ApiMessages');
var channelHash    = require('../Channel').createChannelHash

/* HTTP API */
var HttpApi = async ((events) => {
  var ipfs     = null;
  var userInfo = {};

  logger.debug("Starting HTTP server at port 3001");

  events.on('onIpfsStarted', (program) => {
    ipfs = program.ipfs;
  });

  function errorHandler(err, req, res, next) {
    logger.error(JSON.stringify(err, null, 2));
    res.status(404).json(err);
    throw err;
  }

  app.use(cors());
  app.use(bodyParser.json())
  app.use(methodOverride());
  app.use(errorHandler);
  app.use('/', express.static('client/dist'));

  mime.define({
    'text/plain': ['rb', 'srt', 'log', 'sh'],
    'application/octet-stream': ['zip'],
    'video/webm': ['mkv', 'mp4', 'mov', 'avi']
  });

  /* ROUTES */
  app.get("/api/channel/:channel/add/msg", function(req, res, next) {
    var channel = Base58.encode(crypto.createHash('sha256').update(req.params.channel).digest());
    var text    = req.query.message;
    networkAPI.sendMessage(ipfs, text, channel, userInfo.id)
      .then(function(result) {
        res.json({status: "ok"});
      })
      .catch(next);
  });

  app.get("/api/channel/:channel/add/file", function(req, res, next) {
    var channel = Base58.encode(crypto.createHash('sha256').update(req.params.channel).digest());
    var filePath = decodeURI(req.query.path);
    networkAPI.addFile(ipfs, filePath, channel, userInfo.id)
      .then(function(result) {
        res.json({status: "ok"});
      })
      .catch(next);
  });

  app.get("/api/get/:hash", async( function(req, res, next) {
    var hash = req.params.hash;
    try {
      ipfsAPI.cat(ipfs, hash, (err, result) => {
        if(err) next(err);

        var filename = req.query.name || "";
        var type     = mime.lookup(filename);
        if(req.query.action && req.query.action == "download")
          res.setHeader('Content-disposition', 'attachment; filename=' + filename.replace(",", ""));

        res.setHeader('Content-Type', type);
        result.pipe(res);
      });
    } catch(e) {
      logger.error(e);
    }
  }));

  app.get("/api/pin/:hash", function(req, res, next) {
    var hash = req.params.hash;
    ipfsAPI.pinObject(ipfs, hash)
      .then(function(result) {
        var filename = req.query.name || "";
        logger.info("Pinned", filename);
        res.send(result);
      })
      .catch(next);
  });

  app.get("/api/user/:hash", function(req, res, next) {
    var hash = req.params.hash;
    networkAPI.getUser(ipfs, hash)
      .then(res.send)
      .catch(next);
  });

  app.get("/api/whoami", function(req, res, next) {
    res.send({ username: userInfo.username });
  });

  app.get("/api/swarm/peers", function(req, res, next) {
    ipfsAPI.swarmPeers(ipfs)
      .then(function(peers) {
        res.send(peers.Strings);
      })
      .catch(next);
  });

  app.get("/api/findpeer/:hash", function(req, res, next) {
    var hash = req.params.hash;
    ipfsAPI.dhtFindPeer(ipfs, hash)
      .then(function(peer) {
        res.send(peer);
      })
      .catch(next);
  });

  /* HTTP SERVER */
  var startServer = Promise.promisify((cb) => {
    var s = app.listen(3001, () => cb(null, s));
  });

  var server;
  server = await(startServer());
  logger.info('UI started at http://%s:%s', server.address().address, server.address().port);

  return { server: server, socketServer: http.Server(app) };
});

module.exports = HttpApi;