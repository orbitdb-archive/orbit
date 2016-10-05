'use strict'

import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import NetworkActions from 'actions/NetworkActions'
import Logger from 'logplease'

const logger = Logger.create('SwarmStore', { color: Logger.Colors.Blue })

const SwarmStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions],
  init: function() {
    this.peers = []
  },
  peers: function() {
    return this.orbit.peers
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
    this.orbit.events.on('peers', (peers) => {
      this.peers = peers
      this.trigger(this.peers)
    })
  },
  onDisconnect: function() {
    this.peers = []
  }
})

export default SwarmStore
