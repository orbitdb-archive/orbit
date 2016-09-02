'use strict'

import _ from 'lodash'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import NetworkActions from 'actions/NetworkActions'
import UserActions from 'actions/UserActions'
import Logger from 'logplease'
const logger = Logger.create('UsersStore', { color: Logger.Colors.Cyan })

var UsersStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, UserActions],
  init: function() {
    this.users  = []
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
  },
  onDisconnect: function() {
    this.users = []
    this.trigger(this.users)
  },
  onAddUser: function(user) {
    if(!_.includes(this.users, user))
      this.users.push(user)
  },
  onGetUser: function(id, callback) {
    this.orbit.getUser(id).then((user) => {
      callback(null, user)
    })
  }
})

export default UsersStore
