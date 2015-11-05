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
  // app.use('/assets', express.static('assets/'));
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
    ipfsAPI.cat(ipfs, hash, (err, result) => {
      if(err) next(err);

      var filename = req.query.name || "";
      var type     = mime.lookup(filename);
      if(req.query.action && req.query.action == "download")
        res.setHeader('Content-disposition', 'attachment; filename=' + filename.replace(",", ""));

      res.setHeader('Content-type', type);
      result.pipe(res);
    });
    // ipfsAPI.cat(ipfs, hash)
    //   .then(async (function(result) {
    //     console.log("getting results...");
    //     var filename = req.query.name || "";
    //     var type     = mime.lookup(filename);

    //     if(req.query.action && req.query.action == "download")
    //       res.setHeader('Content-disposition', 'attachment; filename=' + filename.replace(",", ""));

    //     // TODO: set Content-lenght when the statted size is actually correct
    //     // var stat = await (ipfsAPI.statObject(ipfs, hash));
    //     // res.setHeader('Content-length', stat.CumulativeSize);
    //     // res.setHeader('Content-type', type);
    //     if (result.readable) {
    //       console.log("piping...");
    //       result.pipe(process.stdout);
    //       result.pipe(res);
    //       // res.pipe(process.stdout)
    //     } else {
    //       console.log(result)
    //     }
    //   }))
    //   .catch(function(err) {
    //     logger.warn("Got to ipfsAPI.ls!", err);
    //     ipfsAPI.ls(ipfs, hash)
    //       .then(function(result) {
    //         if(result.Objects) {
    //           ipfsAPI.pinObject(ipfs, result.Objects[0].Hash).catch(function(err) { /* ignore */ });
    //           ipfsAPI.pinObject(ipfs, hash).catch(function(err) { /* ignore */ });
    //           res.send(result.Objects[0].Links);
    //         }
    //         else
    //           next("Can't retrieve the file");
    //       })
    //       .catch(function(err) {
    //         next(err);
    //       });
    //   });
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
    var s = app.listen(3001, () => {
      cb(null, s);
    });
  });
  var server = await(startServer());
  var host   = server.address().address;
  var port   = server.address().port;
  logger.info('UI started at http://%s:%s', host, port);

  return { server: server, socketServer: http.Server(app) };
});

module.exports = HttpApi;