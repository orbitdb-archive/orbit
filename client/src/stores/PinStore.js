'use strict'

import _ from 'lodash'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions'
import ChannelActions from 'actions/ChannelActions'
import Logger from 'logplease'
const logger = Logger.create('PinStore', { color: Logger.Colors.Yellow })

const PinStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, ChannelActions],
  init: function() {
    this.pins = {}
  },
  onDisconnect: function() {
    this.pins = {}
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
  },
  onLoadPins: function(hash) {
    const pinChannel = "--planet-express." + hash + ".pins"

    if (!this.pins[hash])
      this.pins[hash] = []

    this.orbit.join(pinChannel)
      .then((joined) => {
        if(joined) {
          logger.info(`Joined #${pinChannel}`)
          const feed = this.orbit.channels[pinChannel].feed

          feed.events.on('data', (name, item) => {
            this._getPins(feed, hash)
          })

          feed.events.on('history', (name, items) => {
            this._getPins(feed, hash)
          })
        }

        // update subscribers with whatever we have atm
        this.trigger(hash, this.pins[hash])
      })
      .catch((e) => console.error(e))
  },
  _getPins: function(feed, hash) {
    const pins = feed.iterator({ limit: -1 })
      .collect()
      // .map((e) => e.payload.value)

    // const current = this.pins[hash].map((e) => e.hash)
    // const newPins = _.difference(pins, current)
    this.pins[hash] = []
    const promises = pins.map((e) => this._processPin(e.hash, e.payload.value))
    Promise.all(promises).then((res) => this.trigger(hash, this.pins[hash]))
    if (promises.length == 0) this.trigger(hash, this.pins[hash])
  },
  _processPin: function(original, pinnedHash) {
    return this.orbit.getPost(pinnedHash)
      .then((post) => this.orbit.getPost(post.content))
      .then((post) => {
        const hash = post.pinned

        if (!this.pins[hash].map((e) => e.hash).includes(pinnedHash)) {
          this.pins[hash].push({ hash: pinnedHash, post: post, original: original })
        }

        return
      })
  },
})

export default PinStore
