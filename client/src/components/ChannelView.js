'use strict';

import React from 'react';
import Channel from 'components/Channel';
import UserActions from 'actions/UserActions';
import SettingsActions from "actions/SettingsActions";
import Themes from 'app/Themes';
import 'styles/ChannelView.scss';

class ChannelView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: props.params.channel,
      appSettings: {},
      user: null
    };
  }

  componentDidMount() {
    UserActions.getUser((user) => this.setState({ user: user}));
    SettingsActions.get((settings, descriptions) => this.setState({ appSettings: settings }));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ channel: nextProps.params.channel });
  }

  render() {
    var theme = this.state.appSettings ? Themes[this.state.appSettings.theme] : null;
    return (
      <div className="ChannelView">
        <Channel
          className="Channel"
          channel={this.state.channel}
          appSettings={this.state.appSettings}
          theme={theme}
          user={this.state.user}
        />
      </div>
    );
  }

}

export default ChannelView;
