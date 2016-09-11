'use strict'

import _ from 'lodash'
import React from 'react'
import GeoPattern from 'lib/geopattern-1.2.3.min'
import Please from "pleasejs"
import ProfilePictures from 'lib/ProfilePictures'
import 'styles/Dashboard.scss'

class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    const c = this._getColor(props.user.id)
    this.state = {
      user: props.user,
      pattern: GeoPattern.generate(props.user.id, { color: c }),
    }
  }

  componentWillReceiveProps(nextProps) {
    const c = this._getColor(nextProps.user.id)
    this.setState({
      user: nextProps.user,
      pattern: GeoPattern.generate(nextProps.user.id, { color: c }),
    })
  }

  onOpenFeed(feed, evt) {
    this.props.onOpenFeed(feed.id)
  }

  _getColor(text) {
    return Please.make_color({
      seed: text || '',
      saturation: 0.4,
      value: 0.7,
      golden: false
    })[0]
  }

  render() {
    const username = this.state.user ? this.state.user.name : null
    const picture = ProfilePictures.getPicture(username)

    return (
      <div className="Dashboard" style={{ backgroundImage: this.state.pattern.toDataUrl() }}>
        <img className="picture" src={picture} />
        <h1 className="username" onClick={this.onOpenFeed.bind(this, this.state.user)}>{username}</h1>
      </div>
    )
  }
}

export default Dashboard
