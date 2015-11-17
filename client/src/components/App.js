'use strict';

import React         from 'react';
import ReactDOM      from 'react-dom';
import Router        from 'react-router';
import { Route, History } from 'react-router/lib';
import UIActions     from "actions/SendMessageAction";
import UserActions   from 'actions/UserActions';
import UserStore     from 'stores/UserStore';
import NetworkStore  from 'stores/NetworkStore';
import NetworkActions  from 'actions/NetworkActions';
import ConnectionStore from 'stores/ConnectionStore';
import ChannelStore  from 'stores/ChannelStore';
import MessageStore  from 'stores/MessageStore';
import UsersStore    from 'stores/UsersStore';
import SettingsStore from 'stores/SettingsStore';
import NotificationActions from 'actions/NotificationActions';
import ChannelsPanel from 'components/ChannelsPanel';
import ChannelView   from 'components/ChannelView';
import SettingsView  from 'components/SettingsView';
import SwarmView     from 'components/SwarmView';
import LoginView     from 'components/LoginView';
import Header        from 'components/Header';
import Themes        from 'app/Themes';

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
      requirePassword: false,
      currentChannel: null,
      theme: null
    };
  },
  componentDidMount: function() {
    UIActions.onJoinChannel.listen(this.joinChannel);

    NetworkActions.connected.listen((network) => {
      if(network.username) UserActions.getWhoami();
    });
    NetworkActions.joinedChannel.listen(this.onJoinedChannel);
    NetworkActions.joinChannelError.listen(this.onJoinChannelError);
    NetworkActions.leftChannel.listen(this.onLeftChannel);

    this.unsubscribeFromSettingsStore   = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null });
    });
    this.unsubscribeFromConnectionStore = ConnectionStore.listen(this.onDaemonConnected);
    this.unsubscribeFromNetworkStore    = NetworkStore.listen(this.onNetworkUpdated);
    this.unsubscribeFromUserStore       = UserStore.listen(this.onUserUpdated);
    this.unsubscribeFromUsersStore      = UsersStore.listen((users) => console.log("Known users updated", users));
    // this.unsubscribeFromChannelStore    = ChannelStore.listen((channels) => console.log("Channels updated", channels));
    this.unsubscribeFromMessageStore    = MessageStore.listen((channel, message) => {
      console.log("New messages on #" + channel);
      if(this.state.currentChannel !== channel) {
        NotificationActions.unreadMessages(channel);
      }
    });
  },
  onDaemonConnected: function(socket) {
    if(socket)
      console.log("Daemon connected", socket);
    else {
      console.error("Daemon disconnected");
      if(this.state.panelOpen) this.togglePanel();
    }
  },
  onNetworkUpdated: function(network) {
    console.log("Network Info updated", network);
  },
  onUserUpdated: function(user) {
    console.log("User updated", user);
    if(!user.username) {
      if(this.state.panelOpen) {
        UIActions.onPanelClosed();
        this.setState({ panelOpen: !this.state.panelOpen });
      }

      this.setState({ location: "Connect" });
      this.history.pushState(null, '/connect');
    } else {
      this.setState({ user: user });
      if(!this.state.panelOpen) this.togglePanel();
      this.setState({ location: null });
      this.history.pushState(null, '/');
    }
  },
  togglePanel: function() {
    if(location && this.state.user) {
      if(this.state.panelOpen) UIActions.onPanelClosed();
      this.setState({ panelOpen: !this.state.panelOpen });
    }
  },
  onJoinedChannel: function(channelInfo) {
    this.togglePanel();
    if("#" + channelInfo.name !== this.state.location) {
      this.setState({ location: "#" + channelInfo.name, requirePassword: false, currentChannel: channelInfo.name });
      this.history.pushState(null, '/channel/' + channelInfo.name);
    }
  },
  onLeftChannel: function (channel) {
    if(channel === this.state.currentChannel) {
      this.setState({ location: null, currentChannel: null, requirePassword: false });
      this.history.pushState(null, '/');
    }
  },
  onJoinChannelError: function(err) {
    this.setState({ requirePassword: true} );
  },
  joinChannel: function(channelName, password) {
    if(channelName === this.state.currentChannel)
      return;
    console.log("Join channel #" + channelName);
    NetworkActions.joinChannel(channelName, password);
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
  },
  goToLocation: function(name, url) {
    this.togglePanel();
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
