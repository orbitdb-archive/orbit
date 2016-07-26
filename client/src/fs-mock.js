'use strict';

module.exports = {
  createWriteStream: function(filename, options) {
    return;
  },
  writeFileSync: function() {
    return;
  },
  writeFile: function(path, data, options, cb) {
    if(typeof options === 'function')
      cb = options;
    cb(null);
  },
  openSync: function() {
    return;
  },
  writeSync: function() {
    return;
  },
  exists: function(path, cb) {
    cb(null, false);
  },
  existsSync: function (path) {
    return false;
  },
  readFileSync(path, options) {
    return;
  },
  statSync(path) {
    return {
      isDirectory: function() {
        return false;
      }
    }
  }
}
