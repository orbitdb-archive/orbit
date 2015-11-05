var fs      = require('fs');
var path    = require('path');
var request = require('request');
var Promise = require('bluebird');
var async   = require('asyncawait/async');
var await   = require('asyncawait/await');

var networkConfig = JSON.parse(fs.readFileSync(path.resolve(process.type ? process.resourcesPath + "/app/" : process.cwd(), "network.json")));
var host          = "http://" + networkConfig.Network.split(":")[0] + ":3006";

// decodes <body> to Json
function decodeResponse(body) {
  return body != null ? JSON.parse(body) : null;
}

function doRequest(url, post, body) {
  return Promise.promisify(function(callback) {
    var done = (err, res, body) => {
      if(res && res.statusCode == 200)
        callback(err, decodeResponse(body));
      else if(res && res.statusCode == 403)
        callback("Unauthorized", null);
      else
        callback("Error: " + body, null);
    };

    if(post)
      request.post({ url: url, form: body }, done);
    else
      request(url, done);
  });
}

module.exports = cache = {
  joinChannel: async ((hash, uid, password) => {
    var url = host + '/channel/' + hash + '/join';
    return await (doRequest(url, true, { "username": uid, "password": password }));
  }),
  getChannelInfo: async ((hash, uid) => {
    var url = host + '/channel/' + hash + '/info/' + uid;
    return await (doRequest(url));
  }),
  getChannel: async ((hash, uid, password) => {
    var url = host + '/channel/' + hash + '/read/' + uid + '?password=' + (password ? password : '');
    return await (doRequest(url));
  }),
  updateChannel: async ((hash, head, metaData, uid, writePassword, readPassword) => {
    var url = host + '/channel/' + hash;
    return await (doRequest(url, true, {
      "head": head,
      "uid": uid,
      "readPassword": (readPassword ? readPassword : ''),
      "writePassword": (writePassword ? writePassword : ''),
      "meta": metaData
    }));
  }),
  changePasswords: async ((hash, uid, password, newReadPassword, newWritePassword) => {
    var url = host + '/channel/' + hash + '/password' +
      '?uid=' + uid +
      '&password=' + (password ? password : '') +
      "&newReadPassword=" + (newReadPassword ? newReadPassword : '') +
      "&newWritePassword=" + (newWritePassword ? newWritePassword : '');

    return await (doRequest(url));
  })
}
