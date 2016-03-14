'use strict';

import React from "react";
import TransitionGroup from "react-addons-css-transition-group";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
import ChannelActions from 'actions/ChannelActions';
import "styles/Message.scss";

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      post: null,
      colorifyUsername: props.colorifyUsername,
      useEmojis: props.useEmojis,
      username: props.username,
      hasHighlights: false,
      isCommand: false
    };
  }

  componentDidMount() {
    ChannelActions.loadPost(this.state.message.value, (err, post) => {
      if(post && post.content) {
        if(post.content.startsWith('/me'))
          this.setState({ isCommand: true });

        post.content.split(" ").forEach((word) => {
          const highlight = MentionHighlighter.highlight(word, this.state.username);
          if(typeof highlight[0] !== 'string')
            this.setState({ hasHighlights: true });
        });
      }
      this.setState({ post: post });
    });
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

    const post = this.state.post;
    let content = (<div>...</div>);

    if(post && post.meta.type === "text") {
      content = <TextMessage text={post.content} useEmojis={this.state.useEmojis} highlightWords={this.state.username}/>;
    } else if(post && post.meta.type === "file") {
      content = <File hash={post.hash} name={post.name} size={post.size}/>;
    } else if(post && post.meta.type === "directory") {
      content = <Directory hash={post.hash} name={post.name} size={post.size} root={true}/>;
    }

    return (
      <div
        className={className}
        onDragEnter={this.onDragEnter.bind(this)}>
        <span className="Timestamp">{ts}</span>
        <User userId={this.state.post ? this.state.post.meta.from : null} colorify={this.state.colorifyUsername} highlight={this.state.isCommand}/>
        <div className={contentClass}>{content}</div>
      </div>
    );
  }

}

export default Message;
