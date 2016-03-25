'use strict';

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Router from 'react-router';
import { Route, History, IndexRoute } from 'react-router/lib';

import UIActions from "actions/UIActions";
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import AppActions from 'actions/AppActions';

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

var App = React.createClass({
  mixins: [History],
  getInitialState: function() {
    return {
      panelOpen: false,
      location: null,
      user: null,
      joiningToChannel: null,
      requirePassword: false,
      currentChannel: null,
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
    NetworkActions.leaveChannel.listen(this.onLeaveChannel);

    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null });
    });
    this.unsubscribeFromConnectionStore = ConnectionStore.listen(this.onDaemonConnected);
    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated);
    this.unsubscribeFromUserStore = UserStore.listen(this.onUserUpdated);
    this.unsubscribeFromMessageStore = MessageStore.listen(this._handleNewMessage);
    NotificationActions.mention.listen(this._handleMention);
  },
  _handleMention: function(channel, message) {
    if(this.state.currentChannel !== channel) {
      document.title = "! " + (this.state.location ? this.state.location : "Orbit");
      AppActions.increaseMentionsCount(channel, 1);
      // TODO: pass on to backend
    }
  },
  _handleNewMessage: function(channel, message) {
    if(this.state.currentChannel !== channel) {
      document.title = "* " + (this.state.location ? this.state.location : "Orbit");
      AppActions.increaseUnreadMessagesCount(channel, 1);
    }
  },
  onDaemonConnected: function(socket) {
    if(socket)
      console.log("Daemon connected", socket);
    else {
      console.error("Daemon disconnected");
      if(this.state.panelOpen) this.togglePanel();
    }
  },
  _reset: function() {
    this.setState(this.getInitialState());
  },
  onNetworkUpdated: function(network) {
    console.log("Network updated", network);
    if(!network) {
      this._reset();
      this.history.pushState(null, '/connect');
    } else {
      this.setState({ networkName: network.name });
    }
  },
  _showConnectView: function() {
          console.log("222");

    this.setState({ location: "Connect", user: null });
    this.history.pushState(null, '/connect');
  },
  onUserUpdated: function(user) {
    console.log("User updated", user);

    if(!user) {
      this.setState({ location: "Connect", user: null });
      this.history.pushState(null, '/connect');
      return;
    }

    // if(user.network) this.setState({ networkName: user.network.name });

    if(user === this.state.user)
      return;

    if(!user.username) {
      if(this.state.panelOpen) {
        UIActions.onPanelClosed();
        this.setState({ panelOpen: !this.state.panelOpen });
      }

      this.setState({ location: "Connect", user: user });
      this.history.pushState(null, '/connect');
    } else {
      this.setState({ user: user });
      if(!this.state.panelOpen) this.togglePanel();
      this.setState({ location: null, user: user });
      this.history.pushState(null, '/');
    }
  },
  togglePanel: function(close = false) {
    if(location && this.state.user) {
      if(this.state.panelOpen) UIActions.onPanelClosed();
      if(close)
        this.setState({ panelOpen: false });
      else
        this.setState({ panelOpen: !this.state.panelOpen });
    }
  },
  joinChannel: function(channelName, password) {
    if(channelName === this.state.currentChannel)
      return;
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
  onLeaveChannel: function (channel) {
    if(channel === this.state.currentChannel) {
      AppActions.setCurrentChannel(null);
      this.setState({ location: null, currentChannel: null, requirePassword: false });
      this.history.pushState(null, '/');
    }
  },
  showChannel: function(channel) {
    if(channel === this.state.currentChannel)
      return;

    console.log("Open view for channel #" + channel);

    AppActions.setCurrentChannel(channel);

    this.togglePanel(true);
    this.setState({ location: "#" + channel, requirePassword: false, currentChannel: channel, joiningToChannel: null });
    this.history.pushState(null, '/channel/' + channel);
  },
  openSettings: function() {
    this.goToLocation("Settings", "/settings");
  },
  openSwarmView: function() {
    this.goToLocation("Swarm", "/swarm");
  },
  disconnect: function() {
    NetworkActions.disconnect();
    this.setState({ user: null });
    this.goToLocation("Connect", "/connect");
    document.title = "Orbit";
  },
  goToLocation: function(name, url) {
    this.togglePanel();
    AppActions.setCurrentChannel(channel);
    this.setState({ location: name, currentChannel: null });
    this.history.pushState(null, url);
  },
  render: function() {
    var header = (
      <Header
        onOpenChannelsPanel={this.togglePanel}
        location={this.state.location}
        theme={this.state.theme}>
      </Header>
    );

    var panel = this.state.panelOpen ? (
      <ChannelsPanel
        onOpenChannelsPanel={this.togglePanel}
        onOpenSwarmView={this.openSwarmView}
        onOpenSettings={this.openSettings}
        onDisconnect={this.disconnect}
        currentChannel={this.state.location}
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
