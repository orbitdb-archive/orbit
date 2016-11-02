'use strict'

import React from 'react'
import Channel from 'components/Channel'
import UserStore from 'stores/UserStore'
import SettingsStore from "stores/SettingsStore"
import Profile from "components/Profile"
import Themes from 'app/Themes'
import 'styles/ChannelView.scss'

class ChannelView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      channelName: decodeURIComponent(props.params.channel),
      appSettings: {},
      user: null,
      showProfile: null
    }
  }

  componentDidMount() {
    this.setState({
      user: UserStore.user,
      appSettings: SettingsStore.settings
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      channelName: decodeURIComponent(nextProps.params.channel),
      appSettings: SettingsStore.settings
    })
  }

  onShowProfile(user, evt) {
    const { showProfile } = this.state
    if(!showProfile || (showProfile && user.id !== showProfile.id))
      this.setState({ showProfile: user })
    else
      this.setState({ showProfile: null })
  }

  renderProfile() {
    return this.state.showProfile 
      ? <Profile user={this.state.showProfile} /> 
      : null
  }

  render() {
    const { user, showProfile, appSettings } = this.state
    const theme = appSettings ? Themes[appSettings.theme] : null

    return (
      <div className="ChannelView">
        {this.renderProfile()}
        <Channel
          className="Channel"
          channel={this.props.params.channel}
          appSettings={appSettings}
          theme={theme}
          user={user}
          onShowProfile={this.onShowProfile.bind(this)}
        />
      </div>
    )
  }
}

export default ChannelView
