'use strict';

import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, hashHistory } from 'react-router';
import Logger from 'logplease';

import 'webcrypto-shim'

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

const logger = Logger.create('App', { color: Logger.Colors.Red });

console.log("---------------------------------------")
window.crypto.subtle.generateKey(
    {
        name: "HMAC",
        hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        //length: 256, //optional, if you want your key length to differ from the hash function's block length
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["sign", "verify"] //can be any combination of "sign" and "verify"
)
.then(function(key){
    //returns a key object
    console.log("generated key:", key);

    window.crypto.subtle.exportKey(
        "jwk", //can be "jwk" or "raw"
        key //extractable must be true
    )
    .then(function(keydata){
        //returns the exported key data
        console.log("exported key:", keydata);

        // window.crypto.subtle.importKey(keydata
        window.crypto.subtle.importKey(
        "jwk", //can be "jwk" or "raw"
        keydata,
        {   //this is the algorithm options
            name: "HMAC",
            hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            //length: 256, //optional, if you want your key length to differ from the hash function's block length
        },
        keydata.ext, //whether the key is extractable (i.e. can be used in exportKey)
        keydata.key_ops //can be any combination of "sign" and "verify"
    )
    .then(function(key){
        //returns the symmetric key
        console.log("imported key:", key);

        const data = new Uint8Array('hello world!')

        window.crypto.subtle.sign(
            {
                name: "HMAC",
            },
            key, //from generateKey or importKey above
            data //ArrayBuffer of data you want to sign
        )
        .then(function(signature){
            //returns an ArrayBuffer containing the signature
            console.log("signature:", new Uint8Array(signature));

            window.crypto.subtle.verify(
                {
                    name: "HMAC",
                },
                key, //from generateKey or importKey above
                signature, //ArrayBuffer of the signature
                data //ArrayBuffer of the data
            )
            .then(function(isvalid){
                //returns a boolean on whether the signature is true or not
                console.log("valid:", isvalid);
                console.log("---------------------------------------")
            })
            .catch(function(err){
                console.error(err);
            });

        })
        .catch(function(err){
            console.error(err);
        });

    })
    .catch(function(err){
        console.error(err);
    });


    })
    .catch(function(err){
        console.error(err);
    });

})
.catch(function(err){
    console.error(err);
});



const views = {
  "Index": "/",
  "Settings": "/settings",
  "Swarm": "/swarm",
  "Connect": "/connect",
  "Channel": "/channel/"
};

const hasIPFS = !!window.ipfs;
console.log("hasIPFS:", hasIPFS)
let orbit// = hasIPFS ? window.orbit : null;

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
      networkName: "Unknown Network"
    };
  },
  componentDidMount: function() {
    const signalServerAddress = this.props.location.query.local ? '0.0.0.0' : '178.62.241.75';
    const ipfsApi = hasIPFS ? window.ipfs : null; // Main.start creates js-ipfs instance if needed
    const ipcRenderer = hasIPFS ? window.ipcRenderer : null;
    const dataPath = '/tmp/orbit-demo-2-';

    // if(!orbit) {
      Main.start(ipfsApi, dataPath, signalServerAddress).then((res) => {
        logger.info("Orbit started");
        logger.debug("PeerId:", res.peerId.ID);
        console.log(res)
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
    // }

    document.title = 'Orbit';

    SkynetActions.start.listen((username) => orbit.connect(null, username, ''));
    UIActions.joinChannel.listen(this.joinChannel);
    // UIActions.showChannel.listen(this.showChannel);
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
    if(hasIPFS) ipcRenderer.send('disconnected')
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
      const channels = JSON.parse(localStorage.getItem( "anonet.app." + this.state.user.username + "." + network.name + ".channels")) || [];
      channels.forEach( (c) => NetworkActions.joinChannel(c, ''));
    }
  },
  _makeChannelsKey: function(username, networkName) {
    return "anonet.app." + username + "." + networkName + ".channels";
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
    // const channelsKey = this._makeChannelsKey(this.state.user.username, this.state.networkName);
    // let channels = JSON.parse(localStorage.getItem(channelsKey)) || [];
    // if(!_.some(channels, { name: channel })){
    //   channels.push({ name: channel });
    //   localStorage.setItem(channelsKey, JSON.stringify(channels));
    // }
    // if(channel === "skynet") {
      // ChannelActions.sendMessage("skynet", "/me was summoned");
      // setInterval(() => {
      //   const i = Math.floor((Math.random() * Protolol.length));
      //   const line = Protolol[i].split(' ');
      //   line.splice(0, 1); // remove "@name"
      //   const text = line.join(" ").replace('#protolol', ''); // remove '#protolol'
      //   ChannelActions.sendMessage("skynet", text);
      // }, 2000);
    // }
  },
  onLeaveChannel: function(channel) {
    const channelsKey = this._makeChannelsKey(this.state.user.username, this.state.networkName);
    let channels = JSON.parse(localStorage.getItem(channelsKey));
    channels = channels.filter((c) => c.name !== channel);
    if (channels.length === 0)
      localStorage.removeItem(channelsKey);
    else
      localStorage.setItem(channelsKey, JSON.stringify(channels));
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
    this.setState({ user: orbit.user });
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
        channels={ChannelStore.channels}
        currentChannel={AppStateStore.state.location}
        username={this.state.user ? this.state.user.username : ""}
        requirePassword={this.state.requirePassword}
        theme={this.state.theme}
        left={this.state.leftSidePanel}
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
