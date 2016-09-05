'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import UIActions from 'actions/UIActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import NotificationActions from 'actions/NotificationActions';
import UserActions from 'actions/UserActions';
import ChannelStore from 'stores/ChannelStore';
import UserStore from 'stores/UserStore';
import Logger from 'logplease';
const logger = Logger.create('FeedStreamStore', { color: Logger.Colors.Cyan });

const FeedStreamStore = Reflux.createStore({
  listenables: [AppActions, UIActions, NetworkActions, ChannelActions],
  init: function() {
    this.feeds = []
    this.feedStream = null
    this.orbit = null
  },
  onInitialize: function(orbit) {
    this.orbit = orbit
  },
  onSetFeedStreamDatabase: function(db) {
    this.feedStream = db

    setInterval(() => {
      this.feeds = this.feedStream.iterator({ limit: -1 })
        .collect()
        .reverse()

      const userIds = this.feeds
        .filter((e) => e.payload.value !== undefined)
        .map((e) => e.payload.value.split('.')[1] || null)
        // .filter((e) => e !== this.orbit.user.id) // filter out current user

      const users = _.uniq(userIds)
        .filter((e) => e != null)
        .map((id) => this.orbit.getUser(id))

      Promise.all(users).then((res) => {
        // this.feeds = res//.map((user) => user.name)
        // console.log("FEEDS", res)
        this.trigger(res)
      })
    }, 1000)

    // this.feedStream.events.on('data', (message) => {
    //   this.feeds = this.feedStream.get({ limit: -1 }).collect()
    //   this.trigger(this.feeds)
    // })

    // this.feedStream.events.on('history', (name, messages) => {
    //   this.feeds = this.feedStream.get({ limit: -1 }).collect()
    //   this.trigger(this.feeds)
    // })
  },
  onDisconnect: function() {
    // TODO
  },
  onSendMessage: function(channel: string, text: string, replyToHash: string) {
    logger.debug("--> Send message: " + text, replyToHash);
    // console.log(channel)
    // console.log(this.feeds)
    if (this.feedStream && !this.feeds.map((e) => e.payload.value).includes(channel)) {
      this.feedStream.add(channel)
        .then((res) => {
          // this.channels[channel].new = false
          logger.debug("Posted first message:", res)
        })
        .catch((e) => console.error(e))
    }
  },
});

export default FeedStreamStore;
