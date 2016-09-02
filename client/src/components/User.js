'use strict'

import React from 'react'
import Profile from "components/Profile"
import Please from "pleasejs"

import 'styles/User.scss'

class User extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: props.user,
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
    const { user, highlight, colorify } = this.state

    const className = highlight ? "User command" : "User"
    const color = colorify ? Please.make_color({
      seed: user ? user.name : '',
      saturation: 0.4,
      value: 0.9,
      golden: false
    }) : ""

    return (
      <div
        className={className}
        style={{ color: user ? color : 'rgb(96, 96, 96)' }}
        onClick={this.props.onShowProfile}
      >
        {user ? user.name : 'Anonymous'}
      </div>
    )
  }
}

export default User
