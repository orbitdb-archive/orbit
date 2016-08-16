'use strict'

import React from 'react'
import TransitionGroup from "react-addons-css-transition-group"
import 'styles/JoinChannel.scss'

var initialStatusMessage   = "This channel requires a password";

class JoinChannel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channelNamePlaceholder: props.channelNamePlaceholder,
      requirePassword: props.requirePassword,
      statusMsg: initialStatusMessage,
      theme: props.theme
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      requirePassword: nextProps.channelNamePlaceholder ? nextProps.requirePassword : false,
      channelNamePlaceholder: nextProps.channelNamePlaceholder,
      theme: nextProps.theme
    });
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if(this.state.requirePassword)
  //     this.refs.password.focus();
  //   Actions.raiseInvalidChannelPassword.listen(() => this.setState({ statusMsg: "Incorrect password" }));
  // }

  componentDidMount() {
    this.refs.channel.focus();
  }

  joinChannel(event) {
    event.preventDefault();
    var channel = this.refs.channel.value.trim();
    if(channel !== '') {
      var password = this.state.requirePassword ? this.refs.password.value.trim() : "";
      this.setState({ requirePassword: false });
      this.props.onJoinChannel(channel, password);
    }
    this.refs.channel.focus();
  }

  handleNameChange(event) {
    event.preventDefault();
    this.setState({
      channelNamePlaceholder: event.target.value,
      requirePassword: false,
      statusMsg: initialStatusMessage
    });
  }

  render() {
    var passwordField = this.state.requirePassword ? (
      <TransitionGroup component="div" transitionName="passwordFieldAnimation" transitionAppear={true} className="passwordContainer">
        <input type="password" ref="password" placeholder="Password..."/>
      </TransitionGroup>
    ) : "";

    var channelNameField = this.state.channelNamePlaceholder ?
      <input type="text" ref="channel" defaultValue={this.state.channelNamePlaceholder} onChange={this.handleNameChange.bind(this)}/> :
      <input type="text" ref="channel" placeholder="channel"/>;

    var final = this.state.requirePassword ? (
      <form onSubmit={this.joinChannel.bind(this)}>
        <input type="submit" value="" style={{ display: "none" }}></input>
        <div className="row">
          <span className="label">#</span>
          <span className="field" style={this.state.theme}>{channelNameField}</span>
        </div>
        <div className="row">
          <span className="label"></span>
          <span className="field" style={this.state.theme}>{passwordField}</span>
        </div>
        <div className="row">
          <span className="label"></span>
          <span className="field"><span className="text">{this.state.statusMsg}</span></span>
        </div>
      </form>
    ) : (
      <form onSubmit={this.joinChannel.bind(this)}>
        <div className="row">
          <span className="label">#</span>
          <span className="field" style={this.state.theme}>{channelNameField}</span>
        </div>
      </form>
    );

    return (
      <div className="JoinChannel">
        {final}
      </div>
    );
  }

}

export default JoinChannel;
