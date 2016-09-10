'use strict'

import _ from 'lodash'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions'
import ChannelActions from 'actions/ChannelActions'
import Logger from 'logplease'
const logger = Logger.create('ReplyStore', { color: Logger.Colors.Yellow })

const ReplyStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, ChannelActions],
  init: function() {
    this.replies = {}
  },
  onDisconnect: function() {
    this.replies = {}
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
  },
  onLoadReplies: function(hash) {
    const replyChannel = "--planet-express." + hash + ".replies"

    if (!this.replies[hash])
      this.replies[hash] = []

    this.orbit.join(replyChannel)
      .then((joined) => {
        if(joined) {
          logger.info(`Joined #${replyChannel}`)
          const feed = this.orbit.channels[replyChannel].feed

          feed.events.on('data', (name, item) => {
            this._getReplies(feed, hash)
          })

          feed.events.on('history', (name, items) => {
            this._getReplies(feed, hash)
          })
        }

        // update subscribers with whatever we have atm
        this.trigger(hash, this.replies[hash])
      })
      .catch((e) => console.error(e))
  },
  _getReplies: function(feed, hash) {
    const replies = feed.iterator({ limit: -1 })
      .collect()
      .map((e) => e.payload.value)

    const current = this.replies[hash].map((e) => e.hash)//.concat(replies)
    const newReplies = _.difference(replies, current).map((e) => this._processReply(e))
    Promise.all(newReplies).then((res) => this.trigger(hash, this.replies[hash]))
  },
  _processReply: function(replyHash) {
    return this.orbit.getPost(replyHash)
      .then((post) => {
        const hash = post.replyto

        if (!this.replies[hash].map((e) => e.hash).includes(replyHash)) {
          this.replies[hash].push({ hash: replyHash, post: post })
        }

        return
      })
  },
})

export default ReplyStore
