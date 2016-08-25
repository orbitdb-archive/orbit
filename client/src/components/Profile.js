'use strict'

import React from 'react'
import ChannelActions from 'actions/ChannelActions';
import BackgroundAnimation from 'components/BackgroundAnimation';
import TransitionGroup from "react-addons-css-transition-group";
import Please from "pleasejs"
import Countries from '../lib/countries.json'
import 'styles/Profile.scss'

class Profile extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: props.user,
      picture: null,
      x: props.x || 0,
      y: props.y || 0,
      showRawData: false,
      theme: props.theme,
      userColor: this._makeColor(props.user.name),
    }
  }

  componentDidMount() {
    this.loadProfilePicture()
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      user: nextProps.user,
      picture: null,
      x: nextProps.x,
      y: nextProps.y,
      showRawData: false,
      theme: nextProps.theme,
      userColor: this._makeColor(nextProps.user.name),
    }, () => this.loadProfilePicture())
  }

  _makeColor(username) {
    return Please.make_color({
      seed: username,
      saturation: 0.4,
      value: 0.9,
      golden: false
    })
  }

  loadProfilePicture() {
    if(this.state.user && this.state.user.image) {
      ChannelActions.loadFile(this.state.user.image, true, false, (err, buffer, url, stream) => {
        this.setState({ picture: url })
      })
    } else {
      this.setState({ picture: '/images/earth.png' })
    }
  }

  onShowRawData(evt) {
    evt.stopPropagation()
    this.setState({ showRawData: !this.state.showRawData })
  }

  render() {
    const { user, picture, x, y, showRawData, userColor } = this.state
    const country = Countries[user.location]
    const location = country ? country + ", Earth" : "Earth"

    const rawData = showRawData ? <pre>{JSON.stringify(user, null, 2)}</pre> : null
    const profileData = showRawData ? null :
      (<div className="profileDataContainer">
        <div className="country">{location}</div>
        <br/><br/><br/><br/>
        <div className="title">Identity Provider:</div>
        <div className="identityProvider">{user.identityProvider.provider}</div>
        <div className="title">Signing Key:</div>
        <div className="signKey">{user.signKey}</div>
      </div>)

    return (
      <div className="Profile" style={{ left: x, top: y }}>
        <span className="close" onClick={this.props.onClose.bind(this, user)}>X</span>
        <TransitionGroup
          transitionName="profilePictureAnimation"
          transitionAppear={true} component="div"
          transitionAppearTimeout={1500}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
        >
          <img className="picture" src={picture} />
        </TransitionGroup>
        <div className="name">{user.name}<span style={{ color: userColor, fontSize: '0.5em', marginLeft: '0.2em' }}>{user.name}</span></div>
        {profileData}
        {rawData}
        {
          showRawData
          ? <div className="more" onClick={this.onShowRawData.bind(this)}>Show profile...</div>
          : <div className="more" onClick={this.onShowRawData.bind(this)}>Show profile data...</div>
        }
        <BackgroundAnimation style={{ top: "-80px", left: "-128px" }} size={256} delay={0.0} theme={this.state.theme}/>
      </div>
    )
  }
}

export default Profile
