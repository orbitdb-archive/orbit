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
import TransitionGroup from "react-addons-css-transition-group";
import moment from 'moment'

import "styles/Reply.scss";

class Reply extends React.Component {

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
      if (post) {
        UserActions.getUser(post.meta.from, (err, user) => {
          const state = {
            post: post,
            formattedTime: moment(post.meta.ts).fromNow(),
            user: user,
          }
          this.setState(state)
        })
      }
    })
  }

  onReplyTo(event) {
    const { post, user } = this.state
    const hash = this.props.message
    this.setState({ replyto: hash })
    this.props.onReplyTo({
      hash: hash,
      content: post.meta.type === 'text' ? post.content : post.name,
      user: user,
    })
  }

  renderContent(post) {
    let content = (<div>...</div>);
    if (post) {
      switch (post.meta.type) {
        case 'text':
          content = (
            <TextMessage
              text={post.content}
              animate={false}
              replyto={null}
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
    return <div className="ReplyContent">{content}</div>;
  }

  render() {
    const { colorifyUsername, style, onDragEnter } = this.props;
    const { user, post, isCommand, hasHighlights, formattedTime } = this.state;

    return (
        <div className="Reply" key={Math.random()}>
          <span className="replyToIcon">↩︎</span>
          <div style={{ width: "100%" }}>
            <div className="row">
              <User
                user={user}
                colorify={true}
                highlight={false}
                onShowProfile={this.props.onShowProfile.bind(this, user)}
                />
              <span className="Timestamp">{formattedTime}</span>
            </div>
            <div style={{ marginTop: "0.1em" }}>{this.renderContent(this.state.post)}</div>
          </div>
        </div>
    );
  }

}

export default Reply;
