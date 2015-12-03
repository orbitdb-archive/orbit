'use strict';

import React from 'react';
import Channel from 'components/Channel';
import ChannelActions from 'actions/ChannelActions';
import UserActions from 'actions/UserActions';
import SettingsActions from "actions/SettingsActions";
import NetworkActions from 'actions/NetworkActions';
import Themes from 'app/Themes';
import 'styles/ChannelView.scss';

class ChannelView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channelName: props.params.channel,
      channel: {},
      appSettings: {},
      user: null
    };
  }

  componentDidMount() {
    UserActions.getUser((user) => this.setState({ user: user}));
    SettingsActions.get((settings, descriptions) => this.setState({ appSettings: settings }));
    NetworkActions.getChannel(this.state.channelName, (channel) => this.setState({ channel: channel }));
    this.unsubscribeFromChannelMode = ChannelActions.channelModeUpdated.listen((channel, modes) => {
      var c = _.cloneDeep(this.state.channel);
      c.modes = modes;
      this.setState({ channel: c });
    });
  }

  componentWillUnmount() {
    this.unsubscribeFromChannelMode();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ channelName: nextProps.params.channel, channel: {} });
    SettingsActions.get((settings, descriptions) => this.setState({ appSettings: settings }));
  }

  render() {
    var theme = this.state.appSettings ? Themes[this.state.appSettings.theme] : null;
    return (
      <div className="ChannelView">
        <Channel
          className="Channel"
          channel={this.state.channelName}
          channelInfo={this.state.channel}
          appSettings={this.state.appSettings}
          theme={theme}
          user={this.state.user}
        />
      </div>
    );
  }

}

export default ChannelView;
