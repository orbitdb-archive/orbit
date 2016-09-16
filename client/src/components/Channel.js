'use strict';

import _ from 'lodash';
import React from 'react';
import Message from 'components/Message';
import ChannelControls from 'components/ChannelControls';
import NewMessageNotification from 'components/NewMessageNotification';
import Dropzone from 'react-dropzone';
import MessageStore from 'stores/MessageStore';
import LoadingStateStore from 'stores/LoadingStateStore';
import UIActions from 'actions/UIActions';
import ChannelActions from 'actions/ChannelActions';
import Profile from "components/Profile"
import 'styles/Channel.scss';
import Logger from 'logplease';
const logger = Logger.create('Channel', { color: Logger.Colors.Cyan });

class Channel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      channelChanged: true,
      channelName: null,
      messages: [],
      loading: false,
      loadingText: 'Connecting...',
      reachedChannelStart: false,
      channelMode: "Public",
      error: null,
      replyto: null,
      dragEnter: false,
      username: props.user ? props.user.username : '',
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme,
      showUserProfile: null,
      userProfilePosition: null
    };

    this.scrollTimer = null;
    this.topMargin = 120;
    this.bottomMargin = 20;
  }

  componentWillReceiveProps(nextProps) {
    // logger.debug("PROPS CHANGED", nextProps, this.state.channelName);
    if(nextProps.channel !== this.state.channelName) {
      this.setState({
        channelChanged: true,
        unreadMessages: 0,
        loading: true,
        loadingText: 'Loading...',
        reachedChannelStart: false,
        messages: []
      });
      UIActions.focusOnSendMessage();
      ChannelActions.loadMessages(nextProps.channel);
    }

    this.setState({
      channelName: nextProps.channel,
      username: nextProps.user ? nextProps.user.username : '',
      appSettings: nextProps.appSettings,
      theme: nextProps.theme
    });
  }

  componentDidMount() {
    this.unsubscribeFromLoadingState = LoadingStateStore.listen(this._updateLoadingState.bind(this))
    this.unsubscribeFromMessageStore = MessageStore.listen(this.onNewMessages.bind(this))
    this.unsubscribeFromErrors = UIActions.raiseError.listen(this._onError.bind(this))
    this.stopListeningChannelState = ChannelActions.reachedChannelStart.listen(this._onReachedChannelStart.bind(this))
    this.node = this.refs.MessagesView
  }

  _updateLoadingState(state) {
    // logger.debug("CHANNEL STATE CHANGED", state, this.state.channelName);
    const channel = state[this.state.channelName]
    if(channel && channel.loadHistory) {
      this.setState({ loading: true, loadingText: channel.loadHistory.message })
    } else if(channel && channel.loadMessages) {
      this.setState({ loading: true, loadingText: channel.loadMessages.message })
    } else {
      this.setState({ loading: false, loadingText: 'Load more messages...' })
    }
  }

  _onError(errorMessage) {
    console.error("Channel:", errorMessage)
    this.setState({ error: errorMessage })
  }

  _onReachedChannelStart() {
    // logger.warn("REACHED CHANNEL START")
    this.setState({ reachedChannelStart: true })
  }

  componentWillUnmount() {
    clearTimeout(this.scrollTimer)
    this.unsubscribeFromMessageStore()
    this.unsubscribeFromErrors()
    this.unsubscribeFromLoadingState()
    this.stopListeningChannelState()
    this.setState({ messages: [] })
  }

  onNewMessages(channel: string, messages) {
    console.log("MESSAGES", channel, messages)
    console.log(this.state.channelName)

    if(channel !== this.state.channelName)
      return;

    this.node = this.refs.MessagesView;
    if(this.node.scrollHeight - this.node.scrollTop + this.bottomMargin > this.node.clientHeight
      && this.node.scrollHeight > this.node.clientHeight + 1
      && this.state.messages.length > 0 && _.last(messages).payload.meta.ts > _.last(this.state.messages).payload.meta.ts
      && this.node.scrollHeight > 0) {
      this.setState({
        unreadMessages: this.state.unreadMessages + 1
      });
    }

    this.setState({ messages: messages });
  }

  sendMessage(text: string, replyto: string) {
    if(text !== '') {
      ChannelActions.sendMessage(this.state.channelName, text, replyto);
      this.setState({ replyto: null })
    }
  }

  sendFile(source) {
    if(source.directory || (source.filename !== '' && source.buffer !== null))
      ChannelActions.addFile(this.state.channelName, source);
  }

  loadOlderMessages() {
    if(!this.state.loading) {
      ChannelActions.loadMoreMessages(this.state.channelName);
    }
  }

  componentWillUpdate() {
    this.node = this.refs.MessagesView;
    this.scrollTop = this.node.scrollTop;
    this.scrollHeight = this.node.scrollHeight;
  }

  componentDidUpdate() {
    this.node = this.refs.MessagesView;
    this.scrollAmount = this.node.scrollHeight - this.scrollHeight;
    this.keepScrollPosition = (this.scrollAmount > 0 && this.scrollTop > (0 + this.topMargin)) || this.state.reachedChannelStart;
    this.shouldScrollToBottom = (this.node.scrollTop + this.node.clientHeight + this.bottomMargin) >= this.scrollHeight;

    if(!this.keepScrollPosition)
      this.node.scrollTop += this.scrollAmount;

    if(this.shouldScrollToBottom)
      this.node.scrollTop = this.node.scrollHeight + this.node.clientHeight;

    // If the channel was changed, scroll to bottom to avoid weird positioning
    // TODO: replace with remembering each channel's scroll position on channel change
    if(this.state.channelChanged) {
      this.onScrollToBottom();
      this.setState({ channelChanged: false });
    }

    // Wait for the render (paint) cycle to finish before checking.
    // The DOM element sizes (ie. scrollHeight and clientHeight) are not updated until the paint cycle finishes.
    if(this.loadMoreTimeout) clearTimeout(this.loadMoreTimeout);
    this.loadMoreTimeout = setTimeout(() => {
      if(this._shouldLoadMoreMessages())
        this.loadOlderMessages();
    }, 20);
  }

  _shouldLoadMoreMessages() {
    return this.node && (this.node.scrollTop - this.topMargin <= 0 || this.node.scrollHeight === this.node.clientHeight);
  }

  onDrop(files) {
    this.setState({ dragEnter: false });
    files.forEach((file) => {
      const meta = { mimeType: file.type, size: file.size }
      // Electron can return a path of a directory
      if(file.path) {
        console.log("FILE", file)
        this.sendFile({ filename: file.path, directory: file.path, meta: meta });
      } else {
        // In browsers, read the files returned by the event
        // TODO: add buffering support
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("FILE", file)
          this.sendFile({ filename: file.name, buffer: event.target.result, meta: meta });
        };
        reader.readAsArrayBuffer(file);
        // console.error("File upload not yet implemented in browser. Try the electron app.");
      }
    });
    UIActions.focusOnSendMessage();
  }

  onDragEnter() {
    this.setState({ dragEnter: true });
  }

  onDragLeave() {
    this.setState({ dragEnter: false });
  }

  onScroll() {
    if(this.scrollTimer)
      clearTimeout(this.scrollTimer);

    // After scroll has finished, check if we should load more messages
    // Using timeout here because of OS-applied scroll inertia
    // this.setState({ loadingText: 'Loading more messages...' })
    this.scrollTimer = setTimeout(() => {
      if(this._shouldLoadMoreMessages())
        this.loadOlderMessages();
    }, 800);


    // If we scrolled to the bottom, hide the "new messages" label
    this.node = this.refs.MessagesView;
    if(this.node.scrollHeight - this.node.scrollTop - 10 <= this.node.clientHeight) {
      this.setState({
        unreadMessages: 0
      });
    }
  }

  onScrollToBottom() {
    UIActions.focusOnSendMessage();
    this.node.scrollTop = this.node.scrollHeight + this.node.clientHeight;
  }

  onScrollToPreview(node) {
    const previewHeight = node.clientHeight
    const previewRect = node.getBoundingClientRect()
    const channelRect = this.node.getBoundingClientRect()
    const amount = previewRect.bottom - channelRect.bottom
    console.log(amount, previewHeight)
    // Scroll down so that we see the full preview element
    if (amount > 0) this.node.scrollTop += amount + 5
  }

  onShowProfile(user, evt) {
    evt.persist()
    evt.stopPropagation()
    // console.log("PROFILE", user, evt)
    if(!this.state.showUserProfile || (this.state.showUserProfile && user.id !== this.state.showUserProfile.id)) {

      var body = document.body, html = document.documentElement;
      var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

      // if(evt.pageY > height / 2)
      //   console.log("clicked on the bottom half")
      // else
      //   console.log("clicked on the top half")

      const profilePopupHeight = 440
      let padBottom = false
      if(evt.pageY + profilePopupHeight > height) {
        // console.log("can't fit it on the screen")
        padBottom = true
      }

      const x = 0;
      const y = 0;

      this.setState({
        showUserProfile: user,
        userProfilePosition: {
          x: evt.target.clientWidth + evt.target.offsetLeft,
          y: padBottom ? (height - profilePopupHeight) : evt.pageY
        }
      })
    } else {
      this.setState({ showUserProfile: null, userProfilePosition: null })
    }
  }

 onReplyTo(message) {
    this.setState({ replyto: message })
    UIActions.focusOnSendMessage();
  }

  renderMessages() {
    const { messages, username, channelName, loading, loadingText, reachedChannelStart, appSettings } = this.state;
    const { colorifyUsernames, useEmojis, useMonospaceFont, font, monospaceFont, spacing } = appSettings;
    const elements = messages.map((message) => (
      <Message
        message={message.payload}
        key={message.hash}
        onReplyTo={this.onReplyTo.bind(this)}
        onShowProfile={this.onShowProfile.bind(this)}
        onDragEnter={this.onDragEnter.bind(this)}
        onScrollToPreview={this.onScrollToPreview.bind(this)}
        highlightWords={username}
        colorifyUsername={colorifyUsernames}
        useEmojis={useEmojis}
        style={{
          fontFamily: useMonospaceFont ? monospaceFont : font,
          fontSize: useMonospaceFont ? '0.9em' : '1.0em',
          fontWeight: useMonospaceFont ? '100' : '300',
          padding: spacing,
        }}
      />
    ));
    elements.unshift(
      <div className="firstMessage" key="firstMessage" onClick={this.loadOlderMessages.bind(this)}>
        {reachedChannelStart && !loading ? `Joined #${channelName}` : loadingText }
      </div>
    );
    return elements;
  }

  renderFileDrop() {
    const { theme, dragEnter, channelName } = this.state;
    if (dragEnter) {
      return (
        <Dropzone
          className="dropzone"
          activeClassName="dropzoneActive"
          disableClick={true}
          onDrop={this.onDrop.bind(this)}
          onDragEnter={this.onDragEnter.bind(this)}
          onDragLeave={this.onDragLeave.bind(this)}
          style={theme} >
            <div ref="dropLabel" style={theme}>Add files to #{channelName}</div>
        </Dropzone>
      );
    }
    return null;
  }

  render() {
    const { showUserProfile, userProfilePosition, unreadMessages, loading, channelMode, appSettings, replyto, theme } = this.state;

    const profile = showUserProfile ?
      <Profile
        user={showUserProfile}
        x={userProfilePosition.x}
        y={userProfilePosition.y}
        theme={theme}
        onClose={this.onShowProfile.bind(this)}/>
      : null

    return (
      <div className="Channel flipped" onDragEnter={this.onDragEnter.bind(this)}>
        <div>{profile}</div>
        <div className="Messages" ref="MessagesView" onScroll={this.onScroll.bind(this)}>
          {this.renderMessages()}
        </div>
        <NewMessageNotification
          onClick={this.onScrollToBottom.bind(this)}
          unreadMessages={unreadMessages} />
        <ChannelControls
          onSendMessage={this.sendMessage.bind(this)}
          onSendFiles={this.onDrop.bind(this)}
          isLoading={loading}
          channelMode={channelMode}
          appSettings={appSettings}
          theme={theme}
          replyto={replyto}
        />
        {this.renderFileDrop()}
      </div>
    );
  }

}

export default Channel;
