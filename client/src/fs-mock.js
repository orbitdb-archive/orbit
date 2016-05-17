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
    console.log("fs-mock", path)
    cb(null, false);
  }
}
