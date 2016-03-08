'use strict';

import React from "react/addons";
import TransitionGroup from "react-addons-css-transition-group";
import UIActions from "actions/SendMessageAction";
import JoinChannel from 'components/JoinChannel';
import ChannelStore from 'stores/ChannelStore';
import NetworkActions from 'actions/NetworkActions';
import BackgroundAnimation from 'components/BackgroundAnimation';
import Halogen from 'halogen';
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
      networkName: props.networkName
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentChannel: nextProps.currentChannel,
      joiningToChannel: nextProps.joiningToChannel,
      requirePassword: nextProps.requirePassword,
      loading: false,
      theme: nextProps.theme,
      networkName: nextProps.networkName
    });
  }

  componentDidMount() {
    this.unsubscribeFromChannelStore = ChannelStore.listen((channels) => {
      this.setState({ openChannels: channels });
    });

      // console.log("ChannelsPanel - channels updated", ChannelStore.channels);
    this.setState({ openChannels: ChannelStore.channels });
    // NetworkActions.getOpenChannels();
  }

  componentWillUnmount() {
    this.unsubscribeFromChannelStore();
  }

  handleJoinChannel(channelName, password) {
    if("#" + channelName === this.state.currentChannel) {
      this.togglePanel();
      return;
    }

    this.setState({ joiningToChannel: channelName, requirePassword: password !== '', loading: true });
    // Actions.onJoinChannel(channelName, password);
    UIActions.onOpenChannel(channelName);
  }

  clearRecentChannels() {
    localStorage.setItem("channels", null);
    this.setState({recentChannels: []});
  }

  togglePanel() {
    if(this.state.currentChannel !== null) {
      this.props.onOpenChannelsPanel();
      this.setState({ requirePassword: false });
    }
  }

  _renderChannel(e) {
    const name = e.name;
    return (
      <div className="row link" key={Math.random()}>
        <span className='channelName' onClick={this.handleJoinChannel.bind(this, name, "")} key={Math.random()}>#{name}</span>
        {e.unreadMessages > 0 ? <span className={e.unreadMessages > 0 ? 'unreadMessages' : ''}  style={this.state.theme}>{e.unreadMessages > 0 ? e.unreadMessages : ""}</span> : ""}
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
              <div className={headerStyle} onClick={this.togglePanel.bind(this)}>
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

        <TransitionGroup component="div" transitionName="darkenerAnimation" transitionAppear={true} className={"darkener"} onClick={this.togglePanel.bind(this)} transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
        </TransitionGroup>
      </div>
    );
  }

}

export default ChannelsPanel;
