'use strict';

import React   from 'react';
import Channel from 'components/Channel';
import SettingsActions from "actions/SettingsActions";
import SettingsStore from 'stores/SettingsStore';
import Themes from 'app/Themes';
import 'styles/ChannelView.scss';

class ChannelView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: props.params.channel,
      appSettings: {}
    };
  }

  componentDidMount() {
    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => this.setState({ appSettings: settings }));
    SettingsActions.get();
  }

  componentWillUnmount() {
    this.unsubscribeFromSettingsStore();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ channel: nextProps.params.channel });
  }

  render() {
    var theme = this.state.appSettings ? Themes[this.state.appSettings.theme] : null;
    return (
      <div className="ChannelView">
        <Channel className="Channel" channel={this.state.channel} appSettings={this.state.appSettings} theme={theme}/>
      </div>
    );
  }

}

export default ChannelView;
