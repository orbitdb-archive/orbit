'use strict';

import React from "react";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
import ChannelActions from 'actions/ChannelActions';
import NotificationActions from 'actions/NotificationActions';
import { getFormattedTime } from '../utils/utils.js';
import "styles/Message.scss";

class Message extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      post: null,
      hasHighlights: false,
      isCommand: false,
      formattedTime: getFormattedTime(props.message.meta.ts),
    };
  }

  componentDidMount() {
    ChannelActions.loadPost(this.props.message.value, (err, post) => {
      const state = {
        post: post
      };
      if (post && post.content) {
        if (post.content.startsWith('/me')) {
          state.isCommand = true;
        }
        post.content.split(' ').forEach((word) => {
          const highlight = MentionHighlighter.highlight(word, this.props.highlightWords);
          if(typeof highlight[0] !== 'string' && this.props.highlightWords !== post.meta.from) {
            state.hasHighlights = true;
            NotificationActions.mention(this.state.channelName, post.content); // TODO: where does channelName come from?
          }
        });
      }
      this.setState(state);
    });
  }

  renderContent() {
    const { highlightWords, useEmojis } = this.props;
    const { isCommand, post } = this.state;
    const contentClass = isCommand ? "Content command" : "Content";
    let content = (<div>...</div>);
    if (post) {
      switch (post.meta.type) {
        case 'text':
          content = (
            <TextMessage
              text={post.content}
              useEmojis={useEmojis}
              highlightWords={post.meta.from !== highlightWords ? highlightWords : ''}
              key={post.hash} />
          );
          break;
        case 'file':
          content = <File hash={post.hash} name={post.name} size={post.size} />;
          break;
        case 'directory':
          content = <Directory hash={post.hash} name={post.name} size={post.size} root={true} />;
          break;
      }
    }
    return <div className={contentClass}>{content}</div>;
  }

  render() {
    const { message, colorifyUsername, style, onDragEnter } = this.props;
    const { post, isCommand, hasHighlights, formattedTime } = this.state;
    const className = hasHighlights ? "Message highlighted" : "Message";
    return (
      <div className={className} style={style} onDragEnter={onDragEnter}>
        <span className="Timestamp">{formattedTime}</span>
        <User
          userId={post ? post.meta.from : null}
          colorify={colorifyUsername}
          highlight={isCommand} />
        {this.renderContent()}
      </div>
    );
  }

}

export default Message;
