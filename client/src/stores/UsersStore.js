'use strict'

import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import NetworkActions from 'actions/NetworkActions'
import UserActions from 'actions/UserActions'
import Logger from 'logplease'

const logger = Logger.create('UsersStore', { color: Logger.Colors.Cyan })

var UsersStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, UserActions],
  init: function() {
    this.users  = {}
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
  },
  onDisconnect: function() {
    this.users = {}
    this.trigger(this.users)
  },
  onAddUser: function(user) {
    if(!this.users[user.id])
      this.users[user.id] = user
  },
  onGetUser: function(id, callback) {
    if (this.users[id])
      return callback(null, this.users[id])

    this.orbit.getUser(id).then((user) => {
      this.users[id] = user
      callback(null, user)
    })
  }
})

export default UsersStore
