'use strict';

import React from "react";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
import ChannelActions from 'actions/ChannelActions';
import UserActions from 'actions/UserActions';
import NotificationActions from 'actions/NotificationActions';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
// import { getFormattedTime } from '../utils/utils.js';
import moment from 'moment'

import "styles/Message.scss";

class Message extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      post: null,
      user: null,
      hasHighlights: false,
      isCommand: false,
      formattedTime: moment(props.message.meta.ts).fromNow(),
      showSignature: false,
      showProfile: null
    };
  }

  componentDidMount() {
    ChannelActions.loadPost(this.props.message.value, (err, post) => {
      const state = {
        post: post
      };
      if (post) {
        UserActions.getUser(post.meta.from, (err, user) => {
          this.setState({ user: user });
        });

        if (post.content) {
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
      }
      this.setState(state);
    });
  }

  onReplyTo(event) {
    const { post, user } = this.state
    const hash = this.props.message.value
    this.setState({ replyto: hash })
    console.log(post)
    this.props.onReplyTo({
      hash: hash,
      content: post.meta.type === 'text' ? post.content : post.name,
      user: user,
    })
  }

  onShowVerification(show, evt) {
    this.setState({ showSignature: true })
    this.setState({ showSignature: show })
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
              replyto={post.replyToContent}
              useEmojis={useEmojis}
              highlightWords={post.meta.from !== highlightWords ? highlightWords : ''}
              key={post.hash}
              onShowProfile={this.props.onShowProfile}
            />
          );
          break;
        case 'file':
          content = <File hash={post.hash} name={post.name} size={post.size} meta={post.meta}/>;
          break;
        case 'directory':
          content = <Directory hash={post.hash} name={post.name} size={post.size} root={true} />;
          break;
      }
    }
    // return <div className={contentClass} onClick={this.onReplyTo.bind(this)}>{content}</div>;
    return <div className={contentClass}>{content}</div>;
  }

  renderVerification() {
    return this.state.post && this.state.post.signKey
      ? <span className="Verified flaticon-linked1"/>
      : null
  }

  renderReply() {
    return null
  }

  render() {
    const { message, colorifyUsername, style, onDragEnter } = this.props;
    const { user, post, isCommand, hasHighlights, formattedTime } = this.state;
    const className = hasHighlights ? "Message highlighted" : "Message";
    const picture = "images/earth.png"

    return (
      <div className={className} style={style} onDragEnter={onDragEnter}>
        <div className="row2">
          <div className="Body">
            <div style={{
                display: "flex",
                marginBottom: "0.25em",
                alignItems: "center"
            }}>
              <img className="Picture" src={picture} />
              <div className="column">
                <User
                  user={user}
                  colorify={colorifyUsername}
                  highlight={isCommand}
                  onShowProfile={this.props.onShowProfile.bind(this, user)}
                  />
                <div className="Timestamp">{formattedTime}</div>
              </div>
            </div>
            {this.renderContent()}
            {this.renderReply()}
            <div className="ActionButton" onClick={this.onReplyTo.bind(this)}>Reply</div>
          </div>
        </div>
      </div>
    );
  }

}

export default Message;
