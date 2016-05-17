'use strict';

import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, hashHistory } from 'react-router';
import Logger from 'logplease';

import AppActions from 'actions/AppActions';
import UIActions from "actions/UIActions";
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import ChannelActions from 'actions/ChannelActions';

import AppStateStore from 'stores/AppStateStore';
import UserStore from 'stores/UserStore';
import UserActions from 'actions/UserActions';
import NetworkStore from 'stores/NetworkStore';
import ConnectionStore from 'stores/ConnectionStore';
import ChannelStore from 'stores/ChannelStore';
import MessageStore from 'stores/MessageStore';
import UsersStore from 'stores/UsersStore';
import SettingsStore from 'stores/SettingsStore';
import LoadingStateStore from 'stores/LoadingStateStore';

import ChannelsPanel from 'components/ChannelsPanel';
import ChannelView from 'components/ChannelView';
import SettingsView from 'components/SettingsView';
import SwarmView from 'components/SwarmView';
import LoginView from 'components/LoginView';
import Header from 'components/Header';
import Themes from 'app/Themes';

import 'normalize.css';
import '../styles/main.css';
import 'styles/App.scss';
import 'styles/Scrollbars.scss';
import 'highlight.js/styles/hybrid.css';

import Main from '../main';

const views = {
  "Index": "/",
  "Settings": "/settings",
  "Swarm": "/swarm",
  "Connect": "/connect",
  "Channel": "/channel/"
};

const logger = Logger.create('App', { color: Logger.Colors.Red });

Main.start()
  .then((orbit) => {
    console.log("Systems started");
    // events.emit('socket.connected', { omg: "hello" })
    // events.on('network', (network) => logger.info("On.Network", network));
    // socket.on(ApiMessages.network.disconnect, () => orbit.disconnect());
    // socket.on(ApiMessages.register, (host, username, password) => orbit.connect(host, username, password));
    // socket.on(ApiMessages.channels.get, (cb) => orbit.getChannels(cb));
    // socket.on(ApiMessages.channel.join, (channel, password, cb) => orbit.join(channel, password, cb));
    // socket.on(ApiMessages.channel.part, (channel) => orbit.leave(channel));
    // socket.on(ApiMessages.channel.messages, (channel, lessThanHash, greaterThanHash, amount, callback) => orbit.getMessages(channel, lessThanHash, greaterThanHash, amount, callback));
    // socket.on(ApiMessages.post.get, (hash, callback) => orbit.getPost(hash, callback));
    // socket.on(ApiMessages.user.get, (hash, cb) => orbit.getUser(hash, cb));
    // socket.on(ApiMessages.message.send, (channel, message, cb) => orbit.sendMessage(channel, message, cb));
    // socket.on(ApiMessages.file.add, (channel, filePath, cb) => orbit.addFile(channel, filePath, cb));
    // socket.on(ApiMessages.directory.get, (hash, cb) => orbit.getDirectory(hash, cb));
    // socket.on(ApiMessages.file.get, (hash, cb) => orbit.getFile(hash, cb));
    // socket.on(ApiMessages.swarm.peers, (cb) => orbit.getSwarmPeers(cb));
    NetworkActions.connect.listen((host, username, password) => orbit.connect(host, username, password));
    NetworkActions.joinChannel.listen((channel, password) => orbit.join(channel, password, (err, res) => {
      logger.debug("joined channel", channel, res);
      if(!err) {
        NetworkActions.joinedChannel(channel);
      } else {
        console.error("Can't join #" + channel + ":", err);
        NetworkActions.joinChannelError(channel, err);
      }
    }));
    ChannelActions.sendMessage.listen((channel: string, text: string, callback) => {
      logger.debug("--> send message" + text);
      UIActions.startLoading(channel, "send");
      orbit.sendMessage(channel, text, (err) => {
        if(err) {
          logger.warn("Couldn't send message: " + err.toString());
          UIActions.raiseError(err.toString());
        }
        UIActions.stopLoading(channel, "send");
      });
    });
    ChannelActions.loadMoreMessages.listen((channel: string) => {
      logger.debug("load more messages from #" + channel);
      if(!MessageStore.channels[channel].loading && MessageStore.channels[channel].canLoadMore) {
        MessageStore.channels[channel].canLoadMore = true;
        // this.loadMessages(channel, MessageStore.getOldestMessage(channel), null, 8);
        // logger.debug("--> GET MESSAGES #" + channel + ", " + olderThanHash + " " + newerThanHash  + " " + amount);
        MessageStore.channels[channel].loading = true;
        UIActions.startLoading(channel, "loadmessages", "Loading messages...");
        const olderThanHash = MessageStore.getOldestMessage(channel);
        orbit.getMessages(channel, olderThanHash, null, 8, (messages) => {
          MessageStore._addMessages(channel, messages, olderThanHash !== null);
          MessageStore.channels[channel].loading = false;
          UIActions.stopLoading(channel, "loadmessages");
        });
      }
    });
    ChannelActions.loadPost.listen((hash: string, callback) => {
      if(!MessageStore.posts[hash]) {
        orbit.getPost(hash, (err, data) => {
          MessageStore.posts[hash] = data;
          callback(err, data);
        })
      } else {
        callback(null, MessageStore.posts[hash]);
      }
    });
    orbit.events.on('network', (network) => {
      // console.log("OMG", network)
      logger.info("On.Network", network)
      NetworkActions.updateNetwork(network)
      // events.emit('network', network)
    });
    orbit.events.on('channels.updated', (channels) => {
      logger.info("On.CahnnelsUpdated", channels)
      ChannelStore._updateChannels(channels);
      // events.emit('network', network)
    });
    // orbit.onSocketConnected({ omg: "hello" })
    NetworkActions.updateNetwork(null)
  })
  .catch((e) => {
    logger.error(e.message);
    logger.error("Stack trace:\n", e.stack);
  });

var App = React.createClass({
  // mixins: [History],
  getInitialState: function() {
    return {
      panelOpen: false,
      user: null,
      location: null,
      joiningToChannel: null,
      requirePassword: false,
      theme: null,
      networkName: "Unknown Network"
    };
  },
  componentDidMount: function() {
    document.title = 'Orbit';

    UIActions.joinChannel.listen(this.joinChannel);
    // UIActions.showChannel.listen(this.showChannel);
    NetworkActions.joinedChannel.listen(this.onJoinedChannel);
    NetworkActions.joinChannelError.listen(this.onJoinChannelError);
    SocketActions.socketDisconnected.listen(this.onDaemonDisconnected);

    // this.unsubscribeFromConnectionStore = ConnectionStore.listen(this.onDaemonConnected);
    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated);
    this.unsubscribeFromUserStore = UserStore.listen(this.onUserUpdated);
    this.stopListeningAppState = AppStateStore.listen(this._handleAppStateChange);
    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null });
    });

    window.onblur = () => {
      AppActions.windowLostFocus();
      // logger.debug("Lost focus!");
    };

    window.onfocus = () => {
      AppActions.windowOnFocus();
      // logger.debug("Got focus!");
    };
  },
  _handleAppStateChange: function(state) {
    let prefix = '', suffix = '';

    if(!AppStateStore.state.hasFocus && AppStateStore.state.unreadMessages[AppStateStore.state.currentChannel] > 0)
      suffix = `(${AppStateStore.state.unreadMessages[AppStateStore.state.currentChannel]})`;

    if(Object.keys(state.unreadMessages).length > 1 || (Object.keys(state.unreadMessages).length === 1 && !Object.keys(state.unreadMessages).includes(AppStateStore.state.currentChannel)))
      prefix = '*';

    if(Object.keys(state.mentions).length > 0)
      prefix = '!';

    if(state.currentChannel) {
      document.title = prefix + ' ' + AppStateStore.state.location + ' ' + suffix;
      this.goToLocation(state.currentChannel, views.Channel + state.currentChannel);
    } else {
      document.title = prefix + ' Orbit';
      this.goToLocation(state.location, views[state.location]);
    }
  },
  _reset: function() {
    this.setState(this.getInitialState());
  },
  onNetworkUpdated: function(network) {
    logger.debug("Network updated");
    console.log(network);
    if(!network) {
      this._reset();
      AppActions.setLocation("Connect");
    } else {
      this.setState({ networkName: network.name });
    }
  },
  _showConnectView: function() {
    this.setState({ user: null });
    AppActions.setLocation("Connect");
  },
  onUserUpdated: function(user) {
    logger.debug("User updated");
    console.log(user);

    if(!user) {
      AppActions.setLocation("Connect");
      return;
    }

    if(user === this.state.user)
      return;

    this.setState({ user: user });

    if(!this.state.panelOpen) this.openPanel();
    AppActions.setLocation(null);
  },
  joinChannel: function(channelName, password) {
    if(channelName === AppStateStore.state.currentChannel) {
      this.closePanel();
      return;
    }
    logger.debug("Join channel #" + channelName);
    NetworkActions.joinChannel(channelName, password);
  },
  onJoinChannelError: function(channel, err) {
    if(!this.state.panelOpen) this.setState({ panelOpen: true });
    this.setState({ joiningToChannel: channel, requirePassword: true} );
  },
  onJoinedChannel: function(channel) {
    logger.debug("Joined channel #" + channel);
    // this.showChannel(channel);
    this.closePanel();
    document.title = `#${channel}`;
    logger.debug("Set title: " + document.title);
    AppActions.setCurrentChannel(channel);
  },
  // showChannel: function(channel) {
  // },
  openSettings: function() {
    this.closePanel();
    AppActions.setLocation("Settings");
  },
  openSwarmView: function() {
    this.closePanel();
    AppActions.setLocation("Swarm");
  },
  closePanel: function() {
    this.setState({ panelOpen: false });
    UIActions.onPanelClosed();
  },
  openPanel: function() {
    this.setState({ panelOpen: true });
  },
  disconnect: function() {
    this.closePanel();
    NetworkActions.disconnect();
    this.setState({ user: null });
    AppActions.setLocation("Connect");
  },
  onDaemonDisconnected: function() {
    AppActions.setLocation("Connect");
  },
  goToLocation: function(name, url) {
    hashHistory.push(url ? url : '/');
  },
  render: function() {
    const header = AppStateStore.state.location && AppStateStore.state.location !== "Connect" ? (
      <Header
        onClick={this.openPanel}
        title={AppStateStore.state.location}
        channels={ChannelStore.channels}
        theme={this.state.theme}>
      </Header>
    ) : null;

    const panel = this.state.panelOpen ? (
      <ChannelsPanel
        onClose={this.closePanel}
        onOpenSwarmView={this.openSwarmView}
        onOpenSettings={this.openSettings}
        onDisconnect={this.disconnect}
        currentChannel={AppStateStore.state.location}
        username={this.state.user ? this.state.user.username : ""}
        requirePassword={this.state.requirePassword}
        theme={this.state.theme}
        networkName={this.state.networkName}
        joiningToChannel={this.state.joiningToChannel}
      />
    ) : "";

    return (
      <div className="App view">
        {panel}
        {header}
        {this.props.children}
      </div>
    );
  }
});

/* MAIN */
render(
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <Route path="channel/:channel" component={ChannelView}/>
      <Route path="settings" component={SettingsView}/>
      <Route path="swarm" component={SwarmView}/>
      <Route path="connect" component={LoginView}/>
    </Route>
  </Router>
  , document.getElementById('content')
);

export default ChannelView;
