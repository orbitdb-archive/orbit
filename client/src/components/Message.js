'use strict';

import React        from "react";
import TransitionGroup from "react-addons-css-transition-group";
import User         from "components/User";
import TextMessage  from "components/TextMessage";
import File         from "components/File";
import Directory    from "components/Directory";
import "styles/Message.scss";

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      colorifyUsername: props.colorifyUsername,
      useEmojis: props.useEmojis,
      username: props.username,
      hasHighlights: false,
      isCommand: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ colorifyUsername: nextProps.colorifyUsername, useEmojis: nextProps.useEmojis, username: nextProps.username });
  }

  onDragEnter(event) {
    this.props.onDragEnter(event);
  }

  onHighlight(command) {
    if(command) {
      this.setState({ isCommand: true });
    } else {
      this.props.onHighlight(this.state.message);
      this.setState({ hasHighlights: true });
    }
  }

  render() {
    var safeTime = (time) => ("0" + time).slice(-2);
    var date     = new Date(this.state.message.meta.ts);
    var ts       = safeTime(date.getHours()) + ":" + safeTime(date.getMinutes()) + ":" + safeTime(date.getSeconds());
    // ts   = this.state.message.ts;

    const post = this.state.message.value;
    let content = (<div>{post}</div>);

    if(post.type === "text") {
      content = <TextMessage
                  text={post.content}
                  useEmojis={this.state.useEmojis}
                  highlight={this.state.username}
                  onHighlight={this.onHighlight.bind(this)}
                  />;
    } else if(post.type === "file") {
      content = <File message={this.state.message}/>;
    } else if(post.type === "list") {
      content = <Directory message={this.state.message} root={true}/>;
    }

    var className = this.state.hasHighlights ? "Message highlighted" : "Message";
    var contentClass = this.state.isCommand ? "Content command" : "Content";

    return (
      <div
        className={className}
        onDragEnter={this.onDragEnter.bind(this)}>
        <span className="Timestamp">{ts}</span>
        <User userId={this.state.message.by} colorify={this.state.colorifyUsername} highlight={this.state.isCommand}/>
        <div className={contentClass}>{content}</div>
      </div>
    );
  }

}

export default Message;
