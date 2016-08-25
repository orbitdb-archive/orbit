'use strict'

import React from 'react'
import Profile from "components/Profile"
import Please from "pleasejs"

import 'styles/User.scss'

class User extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: this.props.user,
      colorify: props.colorify,
      highlight: props.highlight
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      user: nextProps.user,
      colorify: nextProps.colorify,
      highlight: nextProps.highlight
    })
  }

  render() {
    const color = this.state.colorify ? Please.make_color({
      seed: this.state.user ? this.state.user.name : '',
      saturation: 0.4,
      value: 0.9,
      golden: false
    }) : ""

    const className = this.state.highlight ? "User command" : "User"
    const { user, showProfileDetails } = this.state

    return (
      <div
        className={className}
        style={{ color: user ? color : 'rgba(48, 48, 48)' }}
        onClick={this.props.onShowProfile}
      >
        {user ? user.name : 'Anonymous'}
      </div>
    )
  }
}

export default User
