'use strict';

import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import UserActions from 'actions/UserActions'
import NetworkActions from 'actions/NetworkActions'
import Logger from 'logplease'
const logger = Logger.create('UserStore', { color: Logger.Colors.Green })

var UserStore = Reflux.createStore({
  listenables: [AppActions, UserActions, NetworkActions],
  init: function() {
    this.user = null
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
    this.orbit.events.on('connected', (network, user) => {
      logger.info(`Connected: ${network}, ${user}`)
      this._updateUser(user)
    })
  },
  onDisconnect: function() {
    this.user = null
    this.trigger(this.user)
  },
  _updateUser: function(user) {
    logger.debug(`User updated: ${user}`)
    this.user = user

    if(!this.user)
      logger.debug("Not logged in")

    this.trigger(this.user)
  }
})

export default UserStore
