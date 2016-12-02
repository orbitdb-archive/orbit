'use strict'

import Reflux from 'reflux'
import OrbitStore from 'stores/OrbitStore'
import NetworkActions from 'actions/NetworkActions'
import Logger from 'logplease'

const logger = Logger.create('UserStore', { color: Logger.Colors.Green })

var UserStore = Reflux.createStore({
  listenables: [NetworkActions],
  init: function() {
    this.user = null
    OrbitStore.listen((orbit) => {
      orbit.events.on('connected', (network, user) => {
        logger.info(`Connected as ${user}`)
        this._update(user)
      })
    })
  },
  onDisconnect: function() {
    this._update(null)
  },
  _update: function(user) {
    logger.debug(`User updated: ${user}`)
    this.user = user

    if(!this.user)
      logger.debug("Not logged in!")

    this.trigger(this.user)
  }
})

export default UserStore
