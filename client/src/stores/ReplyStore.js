'use strict'

import _ from 'lodash'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import UIActions from 'actions/UIActions'
import NetworkActions from 'actions/NetworkActions'
import ChannelActions from 'actions/ChannelActions'
import SocketActions from 'actions/SocketActions'
import NotificationActions from 'actions/NotificationActions'
import UserActions from 'actions/UserActions'
import ChannelStore from 'stores/ChannelStore'
import UserStore from 'stores/UserStore'
import Logger from 'logplease'
const logger = Logger.create('MessageStore', { color: Logger.Colors.Magenta })

const ReplyStore = Reflux.createStore({
  listenables: [AppActions, UIActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.replies = {}
  },
  onInitialize: function(orbit) {

    // TODO: don't use orbit but orbit-db directly for reply channel
    this.orbit = orbit

    this.orbit.events.on('message', (channel, message) => {
      logger.info("Reply -->", channel, message)
      if (channel.endsWith(".replies")) {
        const c = channel.split('.')[0] + "." + channel.split('.')[1] // remove '.replies'
        this._processReply(c, message)
      }
    })

    this.orbit.events.on('joined', (channel) => {
      if (!this.replies[channel])
        this.replies[channel] = {}

      if (channel.endsWith(".replies")) {
        const feed = this.orbit.channels[channel].feed
        const c = channel.split('.')[0] + "." + channel.split('.')[1] // remove '.replies'

        if (!this.replies[c])
          this.replies[c] = {}

        feed.events.on('history', (name, messages) => {
          messages.forEach((e) => this._processReply(c, e))
        })
      }
    })
  },
  _processReply: function(channel, message) {
    this.orbit.getPost(message.payload.value)
      .then((post) => {
        const hash = post.replyto

        if (!this.replies[channel])
          this.replies[channel] = {}

        if (!this.replies[channel][hash])
          this.replies[channel][hash] = []

        if (!this.replies[channel][hash].map((e) => e.hash).includes(message.payload.value)) {
          this.replies[channel][hash].push({ hash: message.payload.value, post: post })
          // TODO: orderBy(e.meta.ts)
          this.trigger(channel, this.replies[channel])
        }
      })
  },
  _reset: function() {
    this.replies = {}
  },
  onDisconnect: function() {
    this._reset()
  },
})

export default ReplyStore
