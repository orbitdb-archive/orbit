'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
import UIActions from "actions/UIActions";
import JoinChannel from 'components/JoinChannel'; //eslint-disable-line
import ChannelStore from 'stores/ChannelStore';
import AppStateStore from 'stores/AppStateStore';
import NetworkActions from 'actions/NetworkActions';
import BackgroundAnimation from 'components/BackgroundAnimation'; //eslint-disable-line
import Halogen from 'halogen'; //eslint-disable-line
import 'styles/ChannelsPanel.scss';
import 'styles/RecentChannels.scss';

class ChannelsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentChannel: props.currentChannel,
      openChannels: [],
      joiningToChannel: props.joiningToChannel,
      username: props.username,
      requirePassword: props.requirePassword || false,
      loading: false,
      theme: props.theme,
      appState: AppStateStore.state,
      networkName: props.networkName
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentChannel: nextProps.currentChannel,
      joiningToChannel: nextProps.joiningToChannel || this.state.joiningToChannel,
      requirePassword: nextProps.requirePassword,
      loading: false,
      theme: nextProps.theme,
      networkName: nextProps.networkName
    });
  }

  componentDidMount() {
    this.stopListeningAppState = AppStateStore.listen((appState) => {
      this.setState({ appState: appState });
    });

    this.unsubscribeFromChannelStore = ChannelStore.listen((channels) => {
      this.setState({ openChannels: channels });
    });

    this.setState({ openChannels: ChannelStore.channels });
  }

  componentWillUnmount() {
    this.stopListeningAppState();
    this.unsubscribeFromChannelStore();
  }

  onClose() {
    if(this.state.currentChannel !== null)
      this.props.onClose();
  }

  handleJoinChannel(channelName, password) {
    this.setState({ joiningToChannel: channelName, requirePassword: password !== '', loading: true });
    UIActions.joinChannel(channelName);
  }

  clearRecentChannels() {
    localStorage.setItem("channels", null);
    this.setState({recentChannels: []});
  }

  _renderChannel(e) {
    const name = e.name;
    const unreadMessagesCount = this.state.appState.unreadMessages[name] ? this.state.appState.unreadMessages[name] : 0;
    const hasUnreadMessages = unreadMessagesCount > 0;
    const mentionsCount = this.state.appState.mentions[name] ? this.state.appState.mentions[name] : 0;
    const className = "unreadMessages " + (mentionsCount > 0 ? "hasMentions" : "");
    return (
      <div className="row link" key={Math.random()}>
        <span className='channelName' onClick={this.handleJoinChannel.bind(this, name, "")} key={Math.random()}>#{name}</span>
        {hasUnreadMessages ? <span className={className} style={this.state.theme}>{hasUnreadMessages ? unreadMessagesCount : ""}</span> : ""}
        <span className='closeChannelButton' onClick={NetworkActions.leaveChannel.bind(this, name)} key={Math.random()}>Close</span>
      </div>
    );
  }

  render() {
    var headerStyle = this.state.currentChannel ? "header" : "header no-close";
    var color = 'rgba(140, 80, 220, 1)';
    var loadingIcon   = this.state.loading ? (
      <div className="loadingIcon" style={this.state.theme}>
        <Halogen.MoonLoader color={color} size="32px"/>
      </div>
    ) : "";

    var channelsHeaderStyle = this.state.openChannels.length > 0 ? "panelHeader" : "hidden";
    var openChannels = this.state.openChannels.length > 0 ? this.state.openChannels.map((f) => this._renderChannel(f)) : [];
    var channelJoinInputStyle = !this.state.loading ? "joinChannelInput" : "joinChannelInput invisible";

    return (
      <div>
        <TransitionGroup
          transitionName="openPanelAnimation"
          transitionAppear={true}
          transitionAppearTimeout={5000}
          transitionEnterTimeout={5000}
          transitionLeaveTimeout={5000}
          component="div">
          <div className="ChannelsPanel">
            <BackgroundAnimation size="320" startY="58" theme={this.state.theme}/>

            <TransitionGroup
              transitionName="panelHeaderAnimation"
              transitionAppear={true}
              transitionAppearTimeout={5000}
              transitionEnterTimeout={5000}
              transitionLeaveTimeout={5000}
              component="div">
              <div className={headerStyle} onClick={this.onClose.bind(this)}>
                <div className="logo">Orbit</div>
              </div>
            </TransitionGroup>
            <TransitionGroup
              transitionName="networkNameAnimation"
              transitionAppear={true}
              transitionAppearTimeout={5000}
              transitionEnterTimeout={5000}
              transitionLeaveTimeout={5000}
              component="div">
              <div className="networkName">
                <div className="text">{this.state.networkName}</div>
              </div>
            </TransitionGroup>

            <div className="username">{this.state.username}</div>

            {loadingIcon}

            <TransitionGroup
              component="div"
              transitionName="joinChannelAnimation"
              transitionAppear={true}
              transitionAppearTimeout={5000}
              transitionEnterTimeout={5000}
              transitionLeaveTimeout={5000}
              className={channelJoinInputStyle}>
              <JoinChannel
                onJoinChannel={this.handleJoinChannel.bind(this)}
                requirePassword={this.state.requirePassword}
                channelNamePlaceholder={this.state.joiningToChannel}
                theme={this.state.theme}
              />
            </TransitionGroup>


            <div className={channelsHeaderStyle}>Channels</div>

            <TransitionGroup
              component="div"
              transitionName="joinChannelAnimation"
              transitionAppear={true}
              transitionAppearTimeout={5000}
              transitionEnterTimeout={5000}
              transitionLeaveTimeout={5000}
              className="openChannels">
              <div className="RecentChannelsView">
                <div className="RecentChannels">{openChannels}</div>
              </div>
            </TransitionGroup>

            <div className="bottomRow">
              <input type="submit" onClick={this.props.onOpenSettings} value="Settings" style={this.state.theme}/>
              <input type="submit" onClick={this.props.onOpenSwarmView} value="Swarm" style={this.state.theme}/>
              <input type="submit" onClick={this.props.onDisconnect} value="Disconnect" style={this.state.theme}/>
            </div>
          </div>

        </TransitionGroup>

        <TransitionGroup component="div" transitionName="darkenerAnimation" transitionAppear={true} className={"darkener"} onClick={this.onClose.bind(this)} transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
        </TransitionGroup>
      </div>
    );
  }

}

export default ChannelsPanel;
