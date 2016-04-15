'use strict';

import React from 'react';
import Please from "pleasejs";

import 'styles/User.scss';

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: this.props.userId,
      username: this.props.userId,
      colorify: props.colorify,
      highlight: props.highlight
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      uid: nextProps.userId,
      username: nextProps.userId,
      colorify: nextProps.colorify,
      highlight: nextProps.highlight
    });
  }

  render() {
    const color = this.state.colorify ? Please.make_color({
      seed: this.state.username,
      saturation: 0.4,
      value: 0.9,
      golden: false
    }) : "";

    const className = this.state.highlight ? "User command" : "User";

    return (
      <div className={className} style={{color: color}}>{this.state.username}</div>
    );
  }
}

export default User;
