'use strict'

import Reflux from 'reflux'
import OrbitStore from 'stores/OrbitStore'
import Logger from 'logplease'

const logger = Logger.create('NetworkStore', { color: Logger.Colors.Yellow })

var NetworkStore = Reflux.createStore({
  init: function() {
    this.network = null
    OrbitStore.listen((orbit) => {
      orbit.events.on('connected', (network, user) => {
        logger.info("orbit.events.connected", network, user)
        this._update(network, user)
      })
      orbit.events.on('diconnected', (network, user) => {
        logger.info("orbit.events.disconnected", network, user)
        this._update(null, null)
      })
    })
  },
  _update: function(network, user) {
    logger.debug("Received network state", network, user)
    if(!network) logger.debug("Not connected to a network!")
    this.network = network
    this.trigger(this.network)
  },
})

export default NetworkStore
