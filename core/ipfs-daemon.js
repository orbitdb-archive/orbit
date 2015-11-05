
var _        = require('lodash');
var fs       = require('fs');
var path     = require('path');
var async    = require('asyncawait/async');
var await    = require('asyncawait/await');
var Promise  = require('bluebird');
var ipfsdCtl = require('ipfsd-ctl');
var logger   = require('./logger');

var ipfsd = null;

var initIpfs = async (function(ipfsPath) {
  logger.info("Initializing ipfs");
  logger.debug("ipfs data directory:", ipfsPath);

  var oldConfig = path.join(ipfsPath, "/config");
  if(fs.existsSync(oldConfig))
    fs.writeFileSync(oldConfig+".bak", fs.readFileSync(oldConfig));

  var init  = Promise.promisify(function(ipfsPath, cb) { ipfsdCtl.local(ipfsPath, cb); });
  var start = Promise.promisify(function(ipfsd, cb) { ipfsd.init(cb); });
  var ipfs  = await (init(ipfsPath));
  ipfsd     = await (start(ipfs));
  return ipfsd;
});

var startDaemon = async (function(ipfsd) {
  logger.debug("Starting the ipfs daemon");
  var startDaemon = Promise.promisify(function(cb) { ipfsd.startDaemon(cb); });
  var getNodeInfo = Promise.promisify(function(ipfs, cb) { ipfs.id(cb) });
  var instance    = await (startDaemon());
  var node        = await (getNodeInfo(instance));
  logger.info("Started ipfs daemon");
  logger.debug("Node ID", node.ID);
  logger.debug("Listening ipfs connections at:");
  _.each(node.Addresses, function(e) { logger.debug(e); });
  return {instance: instance, nodeInfo: node};
});

var stopDaemon = async (function() {
  logger.debug("Stopping the ipfs daemon");
  var stopDaemon = Promise.promisify(function(cb) { ipfsd.stopDaemon(cb); });
  logger.info("Stopped ipfs daemon");
  return await(stopDaemon());
});

var initConfig = async (function(ipfsd, config) {
  logger.debug("Initializing network configuration");
  var filename  = path.resolve(__dirname, "config.tmp");
  var getConfig = Promise.promisify(function(cb) { ipfsd.getConfig("show", cb); });
  var writeConf = Promise.promisify(function(filePath, data, cb) { fs.writeFile(filePath, JSON.stringify(data, null, 2), cb); });
  var setConf   = Promise.promisify(function(filename, cb) { ipfsd.replaceConf(filename, cb); });

  var json = await (getConfig());
  var conf;
  if(json) {
    conf = JSON.parse(json);
    conf["Bootstrap"] = []; // disable boostrapping for faster startup time, connect later
    conf["SupernodeRouting"] = config.SupernodeRouting || {"Servers":[]};

    if(config.Addresses) {
      conf["Addresses"] = config.Addresses;
    }

    await (writeConf(filename, conf));
    await (setConf(filename));

    if(fs.existsSync(filename))
      fs.unlinkSync(filename);
  }

  return conf;
});

module.exports = {
  init: async (function(ipfsPath, config) {
    var node = await (initIpfs(ipfsPath));
    var conf = await (initConfig(node, config));
    if(!conf) node = null;
    return node;
  }),
  start: function(ipfs) {
    return startDaemon(ipfs);
  },
  stop: function() {
    return stopDaemon();
  }
}