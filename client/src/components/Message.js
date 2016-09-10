'use strict';

import React from "react";
import moment from 'moment'
import MentionHighlighter from 'components/plugins/mention-highlighter';
import User from "components/User";
import File from "components/File";
import Reply from "components/Reply";
import Pinned from "components/Pinned";
import TextMessage from "components/TextMessage";
import Directory from "components/Directory";
import ChannelActions from 'actions/ChannelActions';
import UserActions from 'actions/UserActions';
import NotificationActions from 'actions/NotificationActions';
import TransitionGroup from "react-addons-css-transition-group";
import ReplyStore from 'stores/ReplyStore'
import PinStore from 'stores/PinStore'
import "styles/Message.scss";

class Message extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      post: null,
      originalPost: null,
      user: null,
      originalUser: null,
      hasHighlights: false,
      isCommand: false,
      formattedTime: "",
      showSignature: false,
      showProfile: null,
      showReplies: false,
      showPins: false,
      isPin: null,
      replies: [],
      pins: [],
    };
  }

  componentDidMount() {
    this.unsubscribeFromReplyStore = ReplyStore.listen(this.onNewReplies.bind(this))
    this.unsubscribeFromPinStore = PinStore.listen(this.onNewPins.bind(this))

    ChannelActions.loadPost(this.props.message, (err, post) => {
      if (post) {
        // load the pinned post
        if (post.meta.type === 'pin') {
          ChannelActions.loadPost(post.pinned, (err, pinnedPost) => {
            UserActions.getUser(post.meta.from, (err, originalUser) => {
              UserActions.getUser(pinnedPost.meta.from, (err, user) => {
                this.setState({
                  post: pinnedPost,
                  originalPost: post,
                  user: user,
                  originalUser: originalUser,
                  isPin: post.pinned,
                  formattedTime: moment(pinnedPost.meta.ts).fromNow(),
                });
                // Load replies for this message
                ChannelActions.loadReplies(post.pinned)
                // Load pins for this message
                ChannelActions.loadPins(post.pinned)
              });
            });
          })
        } else {
          // load post normally
          UserActions.getUser(post.meta.from, (err, user) => {
            this.setState({
              post: post,
              originalPost: post,
              user: user,
              originalUser: user,
              formattedTime: moment(post.meta.ts).fromNow(),
            });
            // Load replies for this message
            ChannelActions.loadReplies(this.props.message)
            // Load pins for this message
            ChannelActions.loadPins(this.props.message)
          });
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeFromReplyStore()
    this.unsubscribeFromPinStore()
  }

  onNewReplies(hash, replies) {
    if ((this.state.isPin && hash === this.state.originalPost.pinned)
      ||(!this.state.isPin && hash == this.props.message))
      this.setState({ replies: replies })
  }

  onNewPins(hash, pins) {
    if ((this.state.isPin && hash === this.state.originalPost.pinned)
      ||(!this.state.isPin && hash == this.props.message))
      this.setState({ pins: pins })
  }

  onReplyTo(event) {
    const { originalPost, post, user, isPin } = this.state
    const hash = this.props.message
    this.setState({ replyto: hash })
    this.props.onReplyTo({
      hash: hash,
      target: isPin ? originalPost.pinned : hash,
      // TODO: 'content' is not needed anymore I think
      content: post.meta.type === 'text' ? post.content : post.name,
      user: user,
    })
  }

  onPin() {
    const { originalPost, user, originalUser, isPin } = this.state
    if(!this._hasPinned()) {
      const hash = isPin ? originalPost.pinned : this.props.message
      this.props.onPin({
        hash: hash,
        target: hash,
        // TODO: 'content' is not needed anymore I think
        content: originalPost.meta.type === 'text' ? originalPost.content : originalPost.name,
        user: user,
      })
    } else {
      const hash = isPin ? originalPost.pinned : this.props.message
      const original = originalUser.id === this.props.currentUserId ? this.props.messageHash : null
      const post = this.state.pins.filter((e) => e.post.meta.from === this.props.currentUserId)
      this.props.onUnpin(original, post[0].original, hash)
    }
  }

  onShowReplies() {
    this.setState({ showReplies: !this.state.showReplies })
  }

  onShowPins() {
    this.setState({ showPins: !this.state.showPins })
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
        case 'pin':
          content = <div>{JSON.stringify(post, null, 2)}</div>
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
          {this.state.showReplies ? replies : null }
        </div>
      : null
  }

  _hasPinned() {
    return this.state.pins.map((e) => e.post.meta.from).includes(this.props.currentUserId)
  }

  renderPins() {
    // render message from latest to oldest (reverse)
    const sorted = _.orderBy(this.state.pins, (e) => e.post.meta.ts, ['asc'])
    const pins = sorted.map((e) => {
      // return <div>{e.hash} pinned this post</div>
      return <Pinned
        message={e.hash}
        key={e.hash}
        onShowProfile={this.props.onShowProfile}
      />
    })

    return pins.length > 0
      ? <div className="Replies">
          {this.state.showPins && !this.state.showReplies ? pins : null }
        </div>
      : null
  }

  render() {
    const { currentUserId, colorifyUsername, style, onDragEnter } = this.props;
    const { user, originalUser, post, isCommand, hasHighlights, formattedTime, isPin } = this.state;
    const className = hasHighlights ? "Message highlighted" : "Message";
    const picture = "images/earth.png"

    const showRemoveButton = !isPin && originalUser && currentUserId && currentUserId === originalUser.id
    const showPinButton = user && currentUserId && currentUserId !== user.id

    return (
      <div className={className} style={style} onDragEnter={onDragEnter}>
        <div className="row2">
          <div className="Body">
            {isPin
              ? <div className="PinHeader">
                  <div className="row">
                    <User
                      user={originalUser}
                      colorify={colorifyUsername}
                      highlight={isCommand}
                      onShowProfile={this.props.onShowProfile.bind(this, originalUser)}
                    />
                    <span className="pinText"> pinned</span>
                  </div>
                </div>
              : null
            }
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
            <div className="Statistics">
              {this.state.replies.length > 0 ? <span className="header" onClick={this.onShowReplies.bind(this)}>Replies: {this.state.replies.length}</span> : null}
              {this.state.replies.length > 0 && this.state.pins.length > 0 ?  <span className="spacer">  |  </span> : null}
              {this.state.pins.length > 0 ? <span className="header" onClick={this.onShowPins.bind(this)}>Pins: {this.state.pins.length}</span> : null}
            </div>
            {this.renderReplies()}
            {this.renderPins()}
            <div className="Buttons">
              <span className="ActionButton" onClick={this.onReplyTo.bind(this)}>Reply</span>
              {showRemoveButton
                ? <span>
                    <span className="spacer">  |  </span>
                    <span className="ActionButton" onClick={this.props.onRemove.bind(this)}>{"Remove"}</span>
                  </span>
                : null
              }
              {showPinButton
                ? <span>
                    <span className="spacer">  |  </span>
                    <span className="ActionButton" onClick={this.onPin.bind(this)}>{!this._hasPinned() ? "Pin" : "Unpin"}</span>
                  </span>
                : null
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default Message;
