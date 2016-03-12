'use strict';

import React from "react";
import TransitionGroup from "react-addons-css-transition-group";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
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

  componentDidMount() {
    const content = this.state.message.value.content;
    if(content) {
      if(content.startsWith('/me'))
        this.setState({ isCommand: true });

      content.split(" ").forEach((word) => {
        const highlight = MentionHighlighter.highlight(word, this.state.username);
        if(typeof highlight[0] !== 'string')
          this.setState({ hasHighlights: true });
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      colorifyUsername: nextProps.colorifyUsername,
      useEmojis: nextProps.useEmojis,
      username: nextProps.username
    });
  }

  onDragEnter(event) {
    this.props.onDragEnter(event);
  }

  render() {
    var safeTime = (time) => ("0" + time).slice(-2);
    var date     = new Date(this.state.message.meta.ts);
    var ts       = safeTime(date.getHours()) + ":" + safeTime(date.getMinutes()) + ":" + safeTime(date.getSeconds());
    // ts   = this.state.message.meta.ts; // for debugging timestamps

    var className = this.state.hasHighlights ? "Message highlighted" : "Message";
    var contentClass = this.state.isCommand ? "Content command" : "Content";

    const post = this.state.message.value;
    let content = (<div>{JSON.stringify(post)}</div>);

    if(post.meta.type === "text") {
      content = <TextMessage text={post.content} useEmojis={this.state.useEmojis} highlightWords={this.state.username}/>;
    } else if(post.meta.type === "file") {
      content = <File hash={post.hash} name={post.name} size={post.size}/>;
    } else if(post.meta.type === "directory") {
      content = <Directory hash={post.hash} name={post.name} size={post.size} root={true}/>;
    }

    return (
      <div
        className={className}
        onDragEnter={this.onDragEnter.bind(this)}>
        <span className="Timestamp">{ts}</span>
        <User userId={this.state.message.value.meta.from} colorify={this.state.colorifyUsername} highlight={this.state.isCommand}/>
        <div className={contentClass}>{content}</div>
      </div>
    );
  }

}

export default Message;
