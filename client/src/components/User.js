'use strict'

import React from 'react'
import Profile from "components/Profile"
import Please from "pleasejs"
import 'styles/User.scss'

const colorify = (text) => {
  return Please.make_color({
    seed: text,
    saturation: 0.4,
    value: 0.9,
    golden: false
  })
}

class User extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: props.user,
      colorify: props.colorify,
      highlight: props.highlight,
      color: props.colorify ? colorify(props.user ? props.user.name : '')
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      user: nextProps.user,
      colorify: nextProps.colorify,
      highlight: nextProps.highlight,
      color: nextProps.colorify ? colorify(nextProps.user ? nextProps.user.name : '')
    })
  }

  render() {
    const className = this.state.highlight ? "User command" : "User"
    return (
      <div className={className} style={{color: color}} onClick={this.props.onShowProfile}>
        {this.state.user ? this.state.user.name : ''}
      </div>
    )
  }
}

export default User
