'use strict';

import _ from 'lodash';
import React from 'react/addons';
import AppStateStore from 'stores/AppStateStore';
import ChannelStore from 'stores/ChannelStore';
import UIActions from "actions/UIActions";
import 'styles/Header.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appState: AppStateStore.state,
      openChannels: []
    };
  }

  componentDidMount() {
    this.stopListeningAppState = AppStateStore.listen((appState) => {
      this.setState({ appState: appState });
    });

    this.unsubscribeFromChannelStore = ChannelStore.listen((channels) => {
      var names = Object.keys(channels).map((e) => {
        return { name: channels[e].name };
      });
      this.setState({ openChannels: names });
    });
  }

  componentWillUnmount() {
    this.stopListeningAppState();
    this.unsubscribeFromChannelStore();
  }

  openChannel(channel, event) {
    event.stopPropagation();
    UIActions.showChannel(channel);
  }

  onDragEnter(event) {
    event.preventDefault();
    return false;
  }

  render() {
    // TODO: move channels to its own component
    var filteredChannels = _.filter(this.state.openChannels, (e) => {
      return '#' + e.name !== this.props.title && this.props.title;
    });
    var channels = filteredChannels.map((e) => {
      const unreadMessagesCount = this.state.appState.unreadMessages[e.name] ? this.state.appState.unreadMessages[e.name] : 0;
      const mentionsCount = this.state.appState.mentions[e.name] ? this.state.appState.mentions[e.name] : 0;
      if(unreadMessagesCount > 0) {
        const className = "unreadMessages " + (mentionsCount > 0 ? "hasMentions" : "");
        return (
          <span className="channel">
            <span onClick={this.openChannel.bind(this, e.name)}>#{e.name}</span>
            <span className={className} style={this.props.theme}>{unreadMessagesCount}</span>
          </span>
        );
      }
      else
        return (
          <span className="channel" onClick={this.openChannel.bind(this, e.name)} key={e.name}>#{e.name}</span>
        );
    });

    return (
      <div className="Header" onClick={this.props.onClick} onDragEnter={this.onDragEnter.bind(this)}>
        <div className="ChannelName">
          <div className="currentChannel">
            <TransitionGroup
              component="div"
              transitionName="channelHeaderAnimation"
              transitionEnter={true}
              transitionLeave={false}
              transitionAppear={false}
              transitionAppearTimeout={0}
              transitionEnterTimeout={1000}
              transitionLeaveTimeout={0}>
              <span>{this.props.title}</span>
            </TransitionGroup>
          </div>
          {channels}
        </div>

      </div>
    );
  }

}

export default Header;
