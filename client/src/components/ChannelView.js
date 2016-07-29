'use strict'

import _ from 'lodash'
import React from 'react'
import Channel from 'components/Channel'
import ChannelStore from 'stores/ChannelStore'
import UserStore from 'stores/UserStore'
import SettingsStore from "stores/SettingsStore"
import Themes from 'app/Themes'
import 'styles/ChannelView.scss'

class ChannelView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      channelName: props.params.channel,
      channel: {},
      appSettings: {},
      user: null
    }
  }

  componentDidMount() {
    this.setState({
      user: UserStore.user,
      channel: ChannelStore.get(this.state.channelName),
      appSettings: SettingsStore.settings
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      channelName: nextProps.params.channel,
      channel: ChannelStore.get(nextProps.params.channel),
      appSettings: SettingsStore.settings
    })
  }

  render() {
    var theme = this.state.appSettings ? Themes[this.state.appSettings.theme] : null
    return (
      <div className="ChannelView">
        <Channel
          className="Channel"
          channel={this.props.params.channel}
          channelInfo={this.state.channel}
          appSettings={this.state.appSettings}
          theme={theme}
          user={this.state.user}
        />
      </div>
    )
  }
}

export default ChannelView
