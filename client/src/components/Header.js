'use strict';

import React from 'react/addons';
import ChannelStore from 'stores/ChannelStore';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import UIActions from "actions/SendMessageAction";
import 'styles/Header.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      notifications: null,
      openChannels: [],
      theme: props.theme
    };
  }

  componentDidMount() {
    this.unsubscribeFromNotifications = NotificationActions.unreadMessages.listen((channel) => {
      if(this.state.channelName !== channel)
        this.setState({ notifications: true });
    });

    this.unsubscribeFromChannelStore = ChannelStore.listen((chnls) => {
      var parsed = Object.keys(chnls).map((e) => {
        return { name: chnls[e].name, unreadMessages: chnls[e].unreadMessagesCount };
      });
      // var filtered = _.filter(parsed, (e) => {
      //   return '#' + e.name !== this.state.location && this.state.location;
      // });

      this.setState({ openChannels: parsed });
    });

    // NetworkActions.getOpenChannels();
  }

  componentWillUnmount() {
    this.unsubscribeFromNotifications();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ location: nextProps.location, notifications: false, theme: nextProps.theme });
  }

  openChannelsPanel() {
    this.props.onOpenChannelsPanel();
  }

  openChannel(channel, event) {
    event.stopPropagation();
    UIActions.onOpenChannel(channel);
  }

  onDragEnter(event) {
    event.preventDefault();
    return false;
  }

  render() {
    var style = this.state.location && this.state.location !== "Connect" ? "Header" : "Header none";

    var filteredChannels = _.filter(this.state.openChannels, (e) => {
      return '#' + e.name !== this.state.location && this.state.location;
    });

    var channels = filteredChannels.map((e) => {
      if(e.unreadMessages > 0)
        return (
          <span className="channel">
            <span onClick={this.openChannel.bind(this, e.name)}>#{e.name}</span>
            <span className="unreadMessages">{e.unreadMessages}</span>
          </span>
        );
      else
        return (
          <span className="channel" onClick={this.openChannel.bind(this, e.name)} key={e.name}>#{e.name}</span>
        );
    });

    var location = this.state.location ? <span key={this.state.location}>{this.state.location}</span> : '';

    return (
      <div className={style}
           onDragEnter={this.onDragEnter.bind(this)}
           key="Header"
           onClick={this.openChannelsPanel.bind(this)}
           >
        <div className="ChannelName">
          <div className="currentChannel">
            <TransitionGroup
              component="div"
              transitionName="channelHeaderAnimation"
              transitionEnter={true}
              transitionLeave={false}
              transitionAppearTimeout={0}
              transitionEnterTimeout={1000}
              transitionLeaveTimeout={1000}>
              {location}
            </TransitionGroup>
          </div>
          {channels}
        </div>

      </div>
    );
  }

}

export default Header;
