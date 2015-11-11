'use strict';

var fs     = require('fs');
var crypto = require('crypto');
var Base58 = require('bs58');

var algorithm     = 'aes-256-ecb';
var useEncryption = true;

/* SIGNING FUNCTIONS */
function hashWithSHA512(data, salt) {
  if(!salt) salt = "null";
  var hash = crypto.createHmac('sha512', salt);
  hash.update(data);
  var value = hash.digest('hex');
  return value;
}

function sign(data, privkey, seq, salt) {
  if(!salt) salt = "null";
  var sign = crypto.createSign('RSA-SHA256');
  var hash = hashWithSHA512(data, "" + salt)
  sign.update("" + salt + seq + hash);
  var sig = sign.sign(privkey, 'hex');
  return sig;
}

function verify(data, pubkey, sig, seq, salt) {
  if(!salt) salt = "null";
  var verify = crypto.createVerify('RSA-SHA256');
  var hash   = hashWithSHA512(data, salt);
  verify.update("" + salt + seq + hash);
  var verified = verify.verify(pubkey, sig, 'hex');
  return verified;
}

/* ENCRYPTION */
function encrypt(text, password) {
  if(!useEncryption)
    return text;

  var crypted;
  try {
    var buffer    = new Buffer(text);
    var encrypted = crypto.privateEncrypt(password, buffer);
    crypted       = encrypted.toString("base64");
  } catch(e) {
    console.log("Error while encrypting:", e);
  }
  return crypted;
}

function decrypt(text, password) {
  if(!useEncryption)
    return text;

  var crypted;
  try {
    var buffer    = new Buffer(text, "base64");
    var decrypted = crypto.publicDecrypt(password, buffer);
    crypted       = decrypted.toString("utf8");
  } catch(e) {
    console.log("Error while decrypting:", e);
  }
  return crypted;
}

/* PUBLIC */
module.exports = {
  encrypt: function(payload, salt) {
    return encrypt(payload, salt);
  },
  decrypt: function(payload, salt) {
    return decrypt(payload, salt);
  },
  sign: (data, privateKey, sequenceNumber, salt) => {
    return sign(data, privateKey, sequenceNumber, salt);
  },
  verify: (data, publicKey, signature, sequenceNumber, salt) => {
    return verify(data, publicKey, signature, sequenceNumber, salt);
  },
  hash: (data, salt) => {
    return hashWithSHA512(data, salt);
  }
}