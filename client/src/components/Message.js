'use strict';

import React from "react";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import Reply from "components/Reply";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
import ChannelActions from 'actions/ChannelActions';
import UserActions from 'actions/UserActions';
import NotificationActions from 'actions/NotificationActions';
import TransitionGroup from "react-addons-css-transition-group";
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
      formattedTime: "",
      showSignature: false,
      showProfile: null,
      showReplies: false,
      replies: props.replies || [],
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      replies: nextProps.replies,
    })
  }

  componentDidMount() {
    ChannelActions.loadPost(this.props.message, (err, post) => {
      const state = {
        post: post,
        formattedTime: moment(post.meta.ts).fromNow(),
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
    const hash = this.props.message//.value
    this.setState({ replyto: hash })
    console.log(post)
    this.props.onReplyTo({
      hash: hash,
      content: post.meta.type === 'text' ? post.content : post.name,
      user: user,
    })
  }

  onShowReplies() {
    this.setState({ showReplies: !this.state.showReplies })
  }

  renderContent(post) {
    let content = (<div>...</div>);
    if (post) {
      switch (post.meta.type) {
        case 'text':
          content = (
            <TextMessage
              text={post.content}
              replyto={post.replyToContent}
              useEmojis={true}
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
    return <div className="Content">{content}</div>;
  }

  renderVerification() {
    return this.state.post && this.state.post.signKey
      ? <span className="Verified flaticon-linked1"/>
      : null
  }

  renderReplies() {
    // render message from latest to oldest (reverse)
    const sorted = _.orderBy(this.state.replies, (e) => e.post.meta.ts, ['asc'])
    const replies = sorted.map((e) => {
      return <Reply
        replies={[]}
        message={e.hash}
        key={e.hash}
        onReplyTo={this.props.onReplyTo}
        onShowProfile={this.props.onShowProfile}
        onDragEnter={this.props.onDragEnter}
        highlightWords={false}
        colorifyUsername={true}
        useEmojis={true}
      />
    })

    return replies.length > 0
      ? <div className="Replies">
          <div className="header" onClick={this.onShowReplies.bind(this)}>Replies ({replies.length})</div>
          {this.state.showReplies ? replies : null }
        </div>
      : null
  }

  render() {
    const { colorifyUsername, style, onDragEnter } = this.props;
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
            {this.renderContent(this.state.post)}
            {this.renderReplies()}
            <div className="ActionButton" onClick={this.onReplyTo.bind(this)}>Reply</div>
            {user && this.props.currentUserId === user.id
              ? <span>
                  <span className="spacer">  |  </span>
                  <div className="ActionButton" onClick={this.props.onRemove.bind(this)}>Remove</div>
                </span>
              : null
            }
          </div>
        </div>
      </div>
    );
  }

}

export default Message;
