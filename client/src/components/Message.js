'use strict';

import React        from "react/addons";
import User         from "components/User";
import TextMessage  from "components/TextMessage";
import File         from "components/File";
import Directory    from "components/Directory";

import "styles/Message.scss";

var TransitionGroup = React.addons.CSSTransitionGroup;

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      colorifyUsername: props.colorifyUsername,
      useEmojis: props.useEmojis
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ colorifyUsername: nextProps.colorifyUsername, useEmojis: nextProps.useEmojis });
  }

  onDragEnter(event) {
    this.props.onDragEnter(event);
  }

  render() {
    var safeTime = (time) => ("0" + time).slice(-2);
    var date     = new Date(this.state.message.ts);
    var ts       = safeTime(date.getHours()) + ":" + safeTime(date.getMinutes()) + ":" + safeTime(date.getSeconds());
    // ts   = this.state.message.ts;

    var content = '...';
    if(this.state.message.type === "msg") {
      content = <TextMessage message={this.state.message} useEmojis={this.state.useEmojis}/>;
    } else if(this.state.message.type === "file") {
      content = <File message={this.state.message}/>;
    } else if(this.state.message.type === "list") {
      content = <Directory message={this.state.message} root={true}/>;
    }

    return (
      <TransitionGroup transitionName="messagesAnimation" transitionAppear={true} component="div" className="Message" onDragEnter={this.onDragEnter.bind(this)}>
        <span className="Timestamp">{ts}</span>
        <User userId={this.state.message.uid} colorify={this.state.colorifyUsername}/>
        <div className="Content">{content}</div>
      </TransitionGroup>
    );
  }

}

export default Message;
