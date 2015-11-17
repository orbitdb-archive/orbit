'use strict';

import React from 'react/addons';
import NotificationActions from 'actions/NotificationActions';
import 'styles/Header.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      notifications: null,
      theme: props.theme
    };
  }

  componentDidMount() {
    this.unsubscribeFromNotifications = NotificationActions.unreadMessages.listen((channel) => {
      if(this.state.channelName !== channel) {
        this.setState({ notifications: true });
      }
    });
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

  onDragEnter(event) {
    event.preventDefault();
    return false;
  }

  render() {
    var style = this.state.location && this.state.location !== "Connect" ? "Header" : "Header none";

    var notificationsIcon = this.state.notifications ? (
      <div
        className="notificationsIcon icon flaticon-alarm12"
        style={this.state.theme}
        onClick={this.openChannelsPanel.bind(this)}
      ></div>
    ) : "";

    return (
      <div className={style} onDragEnter={this.onDragEnter.bind(this)} key="Header">
        <TransitionGroup
          component="div"
          className="ChannelName"
          transitionName="channelHeaderAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1000}
        >
          <div key="1" className="text" onClick={this.openChannelsPanel.bind(this)}>
            <span key="location">{this.state.location}</span>
          </div>
        </TransitionGroup>

        {notificationsIcon}

      </div>
    );
  }

}

export default Header;
