'use strict';

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Router from 'react-router';
import { Route, History, IndexRoute } from 'react-router/lib';

import AppActions from 'actions/AppActions';
import UIActions from "actions/UIActions";
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';

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

const views = {
  "Index": "/",
  "Settings": "/settings",
  "Swarm": "/swarm",
  "Connect": "/connect",
  "Channel": "/channel/"
};

var App = React.createClass({
  mixins: [History],
  getInitialState: function() {
    return {
      panelOpen: false,
      user: null,
      joiningToChannel: null,
      requirePassword: false,
      theme: null,
      networkName: "Unknown Network"
    };
  },
  componentDidMount: function() {
    document.title = "Orbit";

    UIActions.joinChannel.listen(this.joinChannel);
    UIActions.showChannel.listen(this.showChannel);
    NetworkActions.joinedChannel.listen(this.onJoinedChannel);
    NetworkActions.joinChannelError.listen(this.onJoinChannelError);
    SocketActions.socketDisconnected.listen(this.onDaemonDisconnected);
    NotificationActions.mention.listen(this._handleMention);

    this.unsubscribeFromConnectionStore = ConnectionStore.listen(this.onDaemonConnected);
    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated);
    this.unsubscribeFromUserStore = UserStore.listen(this.onUserUpdated);
    this.unsubscribeFromMessageStore = MessageStore.listen(this._handleNewMessage);
    this.stopListeningAppState = AppStateStore.listen(this._handleAppStateChange);
    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null });
    });
  },
  _handleAppStateChange: function(state) {
    console.log("STATE CHANGED", state);

    if(state.currentChannel) {
      let prefix = '';
      if(Object.keys(state.unreadMessages).length > 0)
        prefix = '*';
      if(Object.keys(state.mentions).length > 0)
        prefix = '!';

      document.title = prefix + ' ' + AppStateStore.state.location;
      this.goToLocation(state.currentChannel, views.Channel + state.currentChannel);
    } else {
      document.title = "Orbit";
      this.goToLocation(state.location, views[state.location]);
    }

    if(state.currentChannel || state.location)
      this.closePanel();
  },
  _handleMention: function(channel, message) {
    if(AppStateStore.state.currentChannel !== channel) {
      // document.title = "! " + document.title;
      // TODO: pass on to backend
    }
  },
  _handleNewMessage: function(channel, message) {
    if(AppStateStore.state.currentChannel !== channel) {
      // document.title = "* " + document.title;
      AppActions.increaseUnreadMessagesCount(channel, 1);
    }
  },
  _reset: function() {
    this.setState(this.getInitialState());
  },
  onNetworkUpdated: function(network) {
    console.log("Network updated", network);
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
    console.log("User updated", user);

    if(!user) {
      this.setState({ user: null });
      AppActions.setLocation("Connect");
      return;
    }

    if(user === this.state.user)
      return;

    this.setState({ user: user });

    if(!user.username) {
      this.closePanel();
      AppActions.setLocation("Connect");
    } else {
      if(!this.state.panelOpen) this.openPanel();
      AppActions.setLocation(null);
    }
  },
  joinChannel: function(channelName, password) {
    if(channelName === AppStateStore.state.currentChannel) {
      this.closePanel();
      return;
    }
    console.log("Join channel #" + channelName);
    NetworkActions.joinChannel(channelName, password);
  },
  onJoinChannelError: function(channel, err) {
    if(!this.state.panelOpen) this.setState({ panelOpen: true });
    this.setState({ joiningToChannel: channel, requirePassword: true} );
  },
  onJoinedChannel: function(channel) {
    console.log("Joined channel #" + channel, ChannelStore.channels);
    const channelInfo = ChannelStore.get(channel);
    this.showChannel(channelInfo.name);
  },
  showChannel: function(channel) {
    AppActions.setCurrentChannel(channel);
  },
  openSettings: function() {
    AppActions.setLocation("Settings");
  },
  openSwarmView: function() {
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
    NetworkActions.disconnect();
    this.setState({ user: null });
    AppActions.setLocation("Connect");
  },
  onDaemonDisconnected: function() {
    AppActions.setLocation(null);
  },
  goToLocation: function(name, url) {
    this.history.pushState(null, url);
  },
  render: function() {
    const header = AppStateStore.state.location && AppStateStore.state.location !== "Connect" ? (
      <Header
        onClick={this.openPanel}
        title={AppStateStore.state.location}
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
ReactDOM.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="channel/:channel" component={ChannelView}/>
      <Route path="settings" component={SettingsView}/>
      <Route path="swarm" component={SwarmView}/>
      <Route path="connect" component={LoginView}/>
    </Route>
  </Router>
), document.getElementById('content')); // jshint ignore:line

export default ChannelView;
