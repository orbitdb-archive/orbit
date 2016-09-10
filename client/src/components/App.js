'use strict';

import _ from 'lodash'
import React from 'react'
import { render } from 'react-dom'
import { Router, Route, hashHistory } from 'react-router'
import Logger from 'logplease'

import fs from 'fs'

import AppActions from 'actions/AppActions';
import UIActions from "actions/UIActions";
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import ChannelActions from 'actions/ChannelActions';
import SkynetActions from 'actions/SkynetActions';

import AppStateStore from 'stores/AppStateStore';
import UserStore from 'stores/UserStore';
import UserActions from 'actions/UserActions';
import NetworkStore from 'stores/NetworkStore';
import ChannelStore from 'stores/ChannelStore';
import MessageStore from 'stores/MessageStore';
import UsersStore from 'stores/UsersStore';
import SettingsStore from 'stores/SettingsStore';
import LoadingStateStore from 'stores/LoadingStateStore';
import SwarmStore from 'stores/SwarmStore';
import FeedStreamStore from 'stores/FeedStreamStore';

import ChannelsPanel from 'components/ChannelsPanel';
import ChannelView from 'components/ChannelView';
import SettingsView from 'components/SettingsView';
import SwarmView from 'components/SwarmView';
import LoginView from 'components/LoginView';
import Stream from 'components/Stream';
import Dashboard from 'components/Dashboard';
import ChannelControls from 'components/ChannelControls';
import Header from 'components/Header';
import Themes from 'app/Themes';

import 'normalize.css';
import '../styles/main.css';
import 'styles/App.scss';
import 'styles/Scrollbars.scss';
import "styles/Buttons.scss";
// import 'highlight.js/styles/hybrid.css';

import Main from '../main'

const logger = Logger.create('App', { color: Logger.Colors.Red })

const views = {
  "Index": "/",
  "Settings": "/settings",
  "Swarm": "/swarm",
  "Connect": "/connect",
  "Channel": "/channel/",
  "Stream": "/stream"
};

const hasIPFS = !!window.ipfsInstance;
console.log("hasIPFS:", hasIPFS)
let orbit// = hasIPFS ? window.orbit : null;

fs.init(1 * 1024 * 1024, (err) => {
  if(err) {
    logger.error("Couldn't initialize file system:", err)
  } else {
    logger.debug("FileSystem initialized")
  }
})

const feedStream = '--planet-express-feeds2-' + (hasIPFS ? 'goipfs' : 'jsipfs')
let db // feed stream database

var App = React.createClass({
  getInitialState: function() {
    return {
      panelOpen: false,
      leftSidePanel: false,
      user: null,
      location: null,
      joiningToChannel: null,
      requirePassword: false,
      theme: null,
      networkName: "Unknown Network",
      showStream: false,
      feedUser: null,
    };
  },
  componentDidMount: function() {
    const signalServerAddress = this.props.location.query.local ? '0.0.0.0' : '178.62.241.75';
    const ipfsApi = hasIPFS ? window.ipfsInstance : null; // Main.start creates js-ipfs instance if needed
    const ipcRenderer = hasIPFS ? window.ipcRenderer : null;
    const dataPath = '/tmp/orbit-demo-2-';

    Main.start(ipfsApi, dataPath, signalServerAddress).then((res) => {
      logger.info("Orbit started");
      logger.debug("PeerId:", res.peerId.ID);

      orbit = res.orbit;

      if(hasIPFS && ipcRenderer) {
        orbit.events.on('connected', (network, user) => ipcRenderer.send('connected', network, user));
        orbit.events.on('disconnected', () => ipcRenderer.send('disconnected'));
      }


      AppActions.initialize(orbit);
      NetworkActions.updateNetwork(null) // start the App

    })
    .catch((e) => {
      logger.error(e.message);
      logger.error("Stack trace:\n", e.stack);
    });

    document.title = 'Planet Express';

    // SkynetActions.start.listen((username) => orbit.connect(null, username, ''));
    UIActions.joinChannel.listen(this.joinChannel);
    NetworkActions.joinedChannel.listen(this.onJoinedChannel);
    NetworkActions.joinChannelError.listen(this.onJoinChannelError);
    NetworkActions.leaveChannel.listen(this.onLeaveChannel);
    SocketActions.socketDisconnected.listen(this.onDaemonDisconnected);

    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated);
    this.unsubscribeFromUserStore = UserStore.listen(this.onUserUpdated);
    this.stopListeningAppState = AppStateStore.listen(this._handleAppStateChange);
    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null, leftSidePanel: settings.leftSidePanel });
    });

    window.onblur = () => {
      // AppActions.windowLostFocus();
      // logger.debug("Lost focus!");
    };

    window.onfocus = () => {
      // AppActions.windowOnFocus();
      // logger.debug("Got focus!");
    };

    window.temp = () => {
      this.setState({ showStream: !this.state.showStream })
    }
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
      // document.title = prefix + ' ' + AppStateStore.state.location + ' ' + suffix;
      this.goToLocation(state.currentChannel, views.Channel + encodeURIComponent(state.currentChannel));
    } else {
      // document.title = prefix + ' Orbit';
      this.goToLocation(state.location, views[state.location]);
    }
  },
  _reset: function() {
    if(hasIPFS) ipcRenderer.send('disconnected')
    this.setState(this.getInitialState());
  },
  onNetworkUpdated: function(network) {
    logger.debug("Network updated");
    console.log(network);
    if (!network) {
      this._reset();
      AppActions.setLocation("Connect");
    } else {
      // "CONNECTED"
      this.setState({ networkName: network.name });
      const channels = this._getSavedChannels(this.state.networkName, this.state.user.name)
      // channels.forEach((channel) => NetworkActions.joinChannel(channel.name, ''));

      // WIP
      const dbOptions = {
        cacheFile: '/' + this.state.user.id + "/planet-express-data.json",
        maxHistory: 1000
      }

      logger.debug(`Open feedStream database '${feedStream}'`);
      db = orbit._orbitdb.eventlog(feedStream, dbOptions)
      orbit._orbitdb.events.on('data', this._handleFeedStreamMessage) // Subscribe to updates in the database
      db.events.on('ready', (name) => {
        // feed's history loaded
        // console.log("---------------------------------------------")
        // console.log(JSON.stringify(db.iterator({ limit: -1 }).collect()))
        // console.log("---------------------------------------------")
        this.setState({ showStream: true })
      });

      const replyChannel = "--planet-express." + this.state.user.id + ".replies"
      orbit.join(replyChannel)

      const pinChannel = "--planet-express." + this.state.user.id + ".pins"
      orbit.join(pinChannel)

      this.setState({ feedUser: this.state.user })
      AppActions.setFeedStreamDatabase(db)
      NetworkActions.joinChannel("--planet-express." + this.state.user.id)
    }
  },
  _handleFeedStreamMessage(channel, message) {
    if (channel === feedStream) {
      logger.debug("New post in feed\n", JSON.stringify(message, null, 2))
    }
  },
  _makeChannelsKey: function(username, networkName) {
    return "orbit.app." + username + "." + networkName + ".channels";
  },
  _getSavedChannels: function(networkName, username) {
    const channelsKey = this._makeChannelsKey(username, networkName)
    return JSON.parse(localStorage.getItem(channelsKey)) || []
  },
  _saveChannels: function(networkName, username, channels) {
    const channelsKey = this._makeChannelsKey(username, networkName)
    localStorage.setItem(channelsKey, JSON.stringify(channels))
  },
  _showConnectView: function() {
    this.setState({ user: null });
    AppActions.setLocation("Connect");
  },
  onUserUpdated: function(user) {
    logger.debug("User updated");
    console.log(user);

    if (!user) {
      AppActions.setLocation("Connect");
      return;
    }

    if (user === this.state.user)
      return;

    this.setState({ user: user });

    if (!this.state.panelOpen) this.openPanel();
    AppActions.setLocation(null);
  },
  joinChannel: function(channelName, password) {
    if (channelName === AppStateStore.state.currentChannel) {
      this.closePanel();
      return;
    }
    logger.debug("Join channel #" + channelName);
    NetworkActions.joinChannel("--planet-express." + channelName, password);
  },
  onJoinChannelError: function(channel, err) {
    if(!this.state.panelOpen) this.setState({ panelOpen: true });
    this.setState({ joiningToChannel: channel, requirePassword: true} );
  },
  onJoinedChannel: function(channel) {
    logger.debug("Joined channel #" + channel);
    // this.showChannel(channel);

    orbit.getUser(channel.split('.')[1])
      .then((user) => {
        this.setState({ feedUser: user })
        // NetworkActions.joinChannel("--planet-express." + id)
        document.title = `@${user.name}`;
        logger.debug("Set title: " + document.title);
      })

    this.closePanel();
    AppActions.setCurrentChannel(channel);
    let channels = this._getSavedChannels(this.state.networkName, this.state.user.name)
    if (!_.some(channels, { name: channel })) {
      channels.push({ name: channel });
      this._saveChannels(this.state.networkName, this.state.user.name, channels)
    }
  },
  onLeaveChannel: function(channel) {
    const { user, networkName } = this.state
    const channelsKey = this._makeChannelsKey(user.name, networkName)
    const channels = this._getSavedChannels(networkName, user.name).filter((c) => c.name !== channel)
    if (channels.length === 0)
      localStorage.removeItem(channelsKey);
    else
      this._saveChannels(this.state.networkName, this.state.user.name, channels)
  },
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
    orbit.disconnect();
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
  onOpenFeed: function(id) {
    logger.debug("Open feed " + id)
    // orbit.getUser(id)
    //   .then((user) => {
    //     this.setState({ feedUser: user })
    //   })
        NetworkActions.joinChannel("--planet-express." + id)
  },
  onGoHome: function() {
    this.setState({ feedUser: this.state.user })
    NetworkActions.joinChannel("--planet-express." + this.state.user.id)
  },
  sendMessage(text: string, replyto: string) {
    if(text !== '') {
      ChannelActions.sendMessage(this.state.channelName, text, replyto);
      this.setState({ replyto: null })
    }
  },
  onDrop(files) {
    console.log("OBSOLETE FILES", files)
  },
  render: function() {
    // const header = AppStateStore.state.location && AppStateStore.state.location !== "Connect" ? (
    //   <Header
    //     onClick={this.openPanel}
    //     title={AppStateStore.state.location}
    //     channels={ChannelStore.channels}
    //     theme={this.state.theme}>
    //   </Header>
    // ) : null;
    // const header = <div className="Header">HEADER</div>

    const header = this.state.feedUser
      ? <Dashboard
          user={this.state.feedUser}
          onOpenFeed={this.onOpenFeed}
          appSettings={SettingsStore.settings}
        />
      : null

    const showControls = AppStateStore.state.currentChannel && AppStateStore.state.currentChannel.split(".")[1] === this.state.user.id

    // const controls = showControls
    //   ? <ChannelControls
    //       onSendMessage={this.sendMessage}
    //       onDrop={this.onDrop}
    //       appSettings={SettingsStore.settings}
    //       isLoading={false}
    //       theme={null}
    //       replyto={null}
    //     />
    //   : null

    const stream = this.state.showStream
      ? <Stream
          user={this.state.user}
          onOpenFeed={this.onOpenFeed}
          onGoHome={this.onGoHome}
        />
      : null

    return (
      <div className="App view">
        <div className="Container">
          {header}
          <div style={{ display: "flex", flex: "1" }}>
            {stream}
            {this.props.children}
          </div>
        </div>
      </div>
    );
    // const panel = this.state.panelOpen ? (
    //   <ChannelsPanel
    //     onClose={this.closePanel}
    //     onOpenSwarmView={this.openSwarmView}
    //     onOpenSettings={this.openSettings}
    //     onDisconnect={this.disconnect}
    //     channels={ChannelStore.channels}
    //     currentChannel={AppStateStore.state.location}
    //     username={this.state.user ? this.state.user.name : ""}
    //     requirePassword={this.state.requirePassword}
    //     theme={this.state.theme}
    //     left={this.state.leftSidePanel}
    //     networkName={this.state.networkName}
    //     joiningToChannel={this.state.joiningToChannel}
    //   />
    // ) : "";
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
