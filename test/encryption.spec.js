var assert  = require('assert');
var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');
var encryption = require('../core/Encryption');
var utils   = require('../core/utils');
var logger  = require('../core/logger');

var pubkey  = fs.readFileSync(path.resolve(utils.getAppPath(), 'keys/public.pem')).toString('ascii');
var privkey = fs.readFileSync(path.resolve(utils.getAppPath(), 'keys/private.pem')).toString('ascii');


describe('Network Server', () => {
  before(function(done) {
    logger.setLevel('ERROR');
    done();
  });

  /* TESTS */
  describe('Initialize server', function() {

    it('encrypts and decrypts a message', function(done) {
      var msg = new Buffer(1028 * 1000);
      msg.fill('a');
      var enc = encryption.encrypt(msg, null, pubkey);
      assert.notEqual(enc, msg)

      var dec = encryption.decrypt(enc, null, pubkey);
      assert.equal(dec.length, msg.length)
      assert.equal(dec, msg)
      done();
    });

  });

});