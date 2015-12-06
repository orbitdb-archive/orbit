'use strict'

var Promise = require('bluebird')
var async   = require('asyncawait/async')
var await   = require('asyncawait/await')
var request = require('superagent')

class HashCacheClient {
  constructor(host, credentials, network) {
    this.host        = host
    this.credentials = credentials
    this.network     = network
    this.linkedList  = this.linkedList.bind(this)
  }

  linkedList(hash, password) {
    return {
      head: this._getMode(hash, password),
      add: (head) => this._add(hash, password, head),
      setMode: (mode) => this._setMode(hash, password, mode)
    }
  }

  _head(hash, password) {
    return new Promise((resolve, reject) => {
      request
        .get(this.host + '/channel/' + hash + '/head')
        .set('Authorization', this.credentials)
        .send({ password: password })
        .end((err, res) => {
          if(err)
            reject(res.body.message)
          else
            resolve(res ? res.body : {})
        })
    })
  }

  _add(hash, password, head) {
    return new Promise((resolve, reject) => {
      request
        .put(this.host + '/channel/' + hash + '/add')
        .set('Authorization', this.credentials)
        .send({ head: head, password: password })
        .end((err, res) => {
          if(err)
            reject(res ? res.body : err.toString())
          else
            resolve(res ? res.body : {})
        })
    })
  }

  _setMode(hash, password, modes) {
    return new Promise((resolve, reject) => {
      request
        .post(this.host + '/channel/' + hash)
        .set('Authorization', this.credentials)
        .send({ modes: modes, password: password })
        .end((err, res) => {
          if(err)
            reject(res.body.message)
          else
            resolve(res ? res.body : {})
        })
    })
  }

  _getMode(hash, password) {
    return new Promise((resolve, reject) => {
      request
        .get(this.host + '/channel/' + hash)
        .set('Authorization', this.credentials)
        .send({ password: password })
        .end((err, res) => {
          if(err)
            reject(res.body.message)
          else
            resolve(res ? res.body : {})
        })
    })
  }
}

module.exports = {
  connect: (host, username, password) => {
    var credentials = `Basic ${username}=${password}`
    return new Promise((resolve, reject) => {
      request
      .post(host + '/register')
      .set('Authorization', credentials)
      .end((err, res) => {
        if(err)
          reject(err.code === 'ECONNREFUSED' ? "Connection refused" : err.toString());
        else
          resolve(new HashCacheClient(host, credentials, res ? res.body : null));
      })
    })
  }
}
