'use strict';

import React          from "react/addons";
import TransitionGroup from "react-addons-css-transition-group";
import Actions        from 'actions/SendMessageAction';
import JoinChannel    from 'components/JoinChannel';
import ChannelStore   from 'stores/ChannelStore';
import NetworkActions from 'actions/NetworkActions';
import BackgroundAnimation from 'components/BackgroundAnimation';
import Halogen        from 'halogen';
import 'styles/ChannelsPanel.scss';
import 'styles/RecentChannels.scss';

class ChannelsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentChannel: props.currentChannel,
      openChannels: [],
      joiningToChannel: null,
      username: props.username,
      requirePassword: props.requirePassword || false,
      loading: false,
      theme: props.theme
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentChannel: nextProps.currentChannel,
      requirePassword: nextProps.requirePassword,
      loading: false,
      theme: nextProps.theme
    });
  }

  componentDidMount() {
    this.unsubscribeFromChannelStore = ChannelStore.listen((chnls) => {
      var c = Object.keys(chnls).map((e) => {
        return { name: chnls[e].name, unreadMessages: chnls[e].unreadMessagesCount };
      });
      this.setState({ openChannels: c });
    });

    NetworkActions.getOpenChannels();
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
    Actions.onJoinChannel(channelName, password);
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

  render() {
    var headerStyle = this.state.currentChannel ? "header" : "header no-close";
    var color = 'rgba(140, 80, 220, 1)';
    var loadingIcon   = this.state.loading ? (
      <div className="loadingIcon" style={this.state.theme}>
        <Halogen.MoonLoader color={color} size="32px"/>
      </div>
    ) : "";

    var channelsHeaderStyle = this.state.openChannels.length > 0 ? "panelHeader" : "hidden";
    var openChannels = this.state.openChannels.map((e) => {
      return (
        <div className="row link">
          <span className='channelName' onClick={this.handleJoinChannel.bind(this, e.name, "")} key={e.name}>#{e.name}</span>
          {e.unreadMessages > 0 ? <span className={e.unreadMessages > 0 ? 'unreadMessages' : ''}  style={this.state.theme}>{e.unreadMessages > 0 ? e.unreadMessages : ""}</span> : ""}
          <span className='closeChannelButton' onClick={NetworkActions.leaveChannel.bind(this, e.name)}>Close</span>
        </div>
      );
    });

    var channelJoinInputStyle = !this.state.loading ? "joinChannelInput" : "joinChannelInput invisible";

    return (
      <div>
        <TransitionGroup transitionName="openPanelAnimation" transitionAppear={true} component="div">
          <div className="ChannelsPanel">
            <BackgroundAnimation size="320" startY="58" theme={this.state.theme}/>

            <TransitionGroup transitionName="panelHeaderAnimation" transitionAppear={true} component="div">
              <div className={headerStyle} onClick={this.togglePanel.bind(this)}>
                <div className="text">ANONYMOUS NETWORKS</div>
              </div>
            </TransitionGroup>

            <div className="username">{this.state.username}</div>

            {loadingIcon}

            <TransitionGroup component="div" transitionName="joinChannelAnimation" transitionAppear={true} className={channelJoinInputStyle}>
              <JoinChannel
                onJoinChannel={this.handleJoinChannel.bind(this)}
                requirePassword={this.state.requirePassword}
                channelNamePlaceholder={this.state.joiningToChannel}
                theme={this.state.theme}
              />
            </TransitionGroup>


            <div className={channelsHeaderStyle}>Channels</div>

            <TransitionGroup component="div" transitionName="joinChannelAnimation" transitionAppear={true} className="openChannels">
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
        <TransitionGroup component="div" transitionName="darkenerAnimation" transitionAppear={true} className={"darkener"} onClick={this.togglePanel.bind(this)}>
        </TransitionGroup>
      </div>
    );
  }

}

export default ChannelsPanel;
