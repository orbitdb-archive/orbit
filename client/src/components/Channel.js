'use strict'

import _ from 'lodash'
import React from 'react'
import Message from 'components/Message'
import ChannelControls from 'components/ChannelControls'
import NewMessageNotification from 'components/NewMessageNotification'
import Dropzone from 'react-dropzone'
import MessageStore from 'stores/MessageStore'
import ReplyStore from 'stores/ReplyStore'

import LoadingStateStore from 'stores/LoadingStateStore'
import UIActions from 'actions/UIActions'
import ChannelActions from 'actions/ChannelActions'
import NetworkActions from 'actions/NetworkActions'
import Profile from "components/Profile"
import Spinner from 'components/Spinner'
import 'styles/Channel.scss'
import Logger from 'logplease'
const logger = Logger.create('Channel', { color: Logger.Colors.Cyan })


class Channel extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      channelChanged: true,
      channelName: null,
      messages: [],
      replies: [],
      loading: true,
      loadingText: 'Connecting...',
      reachedChannelStart: false,
      channelMode: "Public",
      error: null,
      replyto: null,
      dragEnter: false,
      user: props.user,
      username: props.user ? props.user.username : '',
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme,
      showUserProfile: null,
      userProfilePosition: null,
      loadCount: 0,
    }

    this.scrollTimer = null
    this.topMargin = 120
    this.bottomMargin = 20
  }

  componentWillReceiveProps(nextProps) {
    // logger.debug("PROPS CHANGED", nextProps, this.state.channelName)
    if(nextProps.channel !== this.state.channelName) {
      this.setState({
        channelChanged: true,
        unreadMessages: 0,
        loading: true,
        loadingText: 'Loading...',
        reachedChannelStart: false,
        messages: [],
        replyto: null,
        loadCount: 0,
      })
      UIActions.focusOnSendMessage()
      ChannelActions.loadMessages(nextProps.channel)
      this.setState({ replies: ReplyStore.replies[nextProps.channel] || [] })
    }

    this.setState({
      channelName: nextProps.channel,
      user: nextProps.user,
      username: nextProps.user ? nextProps.user.name : '',
      appSettings: nextProps.appSettings,
      theme: nextProps.theme
    })
  }

  componentDidMount() {
    this.unsubscribeFromLoadingState = LoadingStateStore.listen(this._updateLoadingState.bind(this))
    this.unsubscribeFromMessageStore = MessageStore.listen(this.onNewMessages.bind(this))
    this.unsubscribeFromReplyStore = ReplyStore.listen(this.onNewReplies.bind(this))
    this.unsubscribeFromErrors = UIActions.raiseError.listen(this._onError.bind(this))
    this.stopListeningChannelState = ChannelActions.reachedChannelStart.listen(this._onReachedChannelStart.bind(this))
    this.node = this.refs.MessagesView
    this.setState({ replies: ReplyStore.replies[this.channelName] || [] })
  }

  _updateLoadingState(state) {
    // logger.debug("CHANNEL STATE CHANGED", state, this.state.channelName)
    const channel = state[this.state.channelName]
    // if(channel && channel.loadHistory) {
    //   this.setState({ loading: true, loadingText: channel.loadHistory.message })
    // } else if(channel && channel.loadMessages) {
    //   this.setState({ loading: true, loadingText: channel.loadMessages.message })
    // } else {
    //   this.setState({ loading: false, loadingText: 'Load more messages...' })
    // }
    if(channel && channel.loadHistory && !channel.loadMessages) {
      this.setState({ loading: true })
    } else if(channel && channel.loadMessages) {
      this.setState({ loading: true })
    } else {
      this.setState({ loading: false })
    }
  }

  _onError(errorMessage) {
    console.error("Channel:", errorMessage)
    this.setState({ error: errorMessage })
  }

  _onReachedChannelStart() {
    // logger.warn("REACHED CHANNEL START")
    // this.setState({ reachedChannelStart: true })
  }

  componentWillUnmount() {
    clearTimeout(this.scrollTimer)
    this.unsubscribeFromReplyStore()
    this.unsubscribeFromMessageStore()
    this.unsubscribeFromErrors()
    this.unsubscribeFromLoadingState()
    this.stopListeningChannelState()
    this.setState({ messages: [], replies: [] })
  }

  onNewReplies(channel, replies) {
    // if(channel !== this.state.channelName)
    //   return
    this.setState({ replies: replies })
  }

  onNewMessages(channel: string, res) {
    const messages = res

    if(channel !== this.state.channelName)
      return

    this.node = this.refs.MessagesView
    if(this.node.scrollHeight - this.node.scrollTop + this.bottomMargin > this.node.clientHeight
      && this.node.scrollHeight > this.node.clientHeight + 1
      && this.state.messages.length > 0 && _.last(messages).payload.meta.ts > _.last(this.state.messages).payload.meta.ts
      && this.node.scrollHeight > 0) {
      this.setState({
        unreadMessages: this.state.unreadMessages + 1
      })
    }

    const beginning = messages.length === 0 && this.state.loadCount !== 0

    this.setState({
      messages: messages,
      reachedChannelStart: beginning,
      loadCount: messages.length,
      // loading: !beginning,
    })

    this.onScroll()
  }

  sendMessage(text: string, replyto: string) {
    if(text !== '') {
      ChannelActions.sendMessage(this.state.channelName, text, replyto)
      this.setState({ replyto: null })
    }
  }

  sendFile(source) {
    if(source.directory || (source.filename !== '' && source.buffer !== null))
      ChannelActions.addFile(this.state.channelName, source)
  }

  loadOlderMessages() {
    console.log(this.state.loading)
    if(!this.state.loading) {
      ChannelActions.loadMoreMessages(this.state.channelName)
    }
  }

  componentWillUpdate() {
    this.node = this.refs.MessagesView
    this.scrollTop = this.node.scrollTop
    this.scrollHeight = this.node.scrollHeight
  }

  _shouldLoadMoreMessages() {
    console.log(this.node.scrollTop + this.node.clientHeight > this.node.scrollHeight - this.topMargin, this.node.scrollTop, this.node.clientHeight, this.node.scrollHeight, this.topMargin)
    return (this.node.scrollTop + this.node.clientHeight) > (this.node.scrollHeight - this.topMargin)
    // return this.node && (this.node.scrollTop - this.topMargin <= 0 || this.node.scrollHeight === this.node.clientHeight)
  }

  onDrop(files) {
    this.setState({ dragEnter: false })
    files.forEach((file) => {
      const meta = { mimeType: file.type, size: file.size }
      // Electron can return a path of a directory
      if(file.path) {
        console.log("FILE", file)
        this.sendFile({ filename: file.path, directory: file.path, meta: meta })
      } else {
        // In browsers, read the files returned by the event
        // TODO: add buffering support
        const reader = new FileReader()
        reader.onload = (event) => {
          console.log("FILE", file)
          this.sendFile({ filename: file.name, buffer: event.target.result, meta: meta })
        }
        reader.readAsArrayBuffer(file)
        // console.error("File upload not yet implemented in browser. Try the electron app.")
      }
    })
    UIActions.focusOnSendMessage()
  }

  onDragEnter() {
    this.setState({ dragEnter: true })
  }

  onDragLeave() {
    this.setState({ dragEnter: false })
  }

  onScroll() {
    if(this.scrollTimer)
      clearTimeout(this.scrollTimer)

    // After scroll has finished, check if we should load more messages
    // Using timeout here because of OS-applied scroll inertia
    // this.setState({ loadingText: 'Loading more...' })
    this.scrollTimer = setTimeout(() => {
      if(this._shouldLoadMoreMessages()) {
        this.setState({ loadingText: "Loading..." })
        this.loadOlderMessages()
        setTimeout(() => {
          this.setState({ loadingText: <br/> })
        }, 1000)
      }
    }, 800)


    // If we scrolled to the bottom, hide the "new messages" label
    this.node = this.refs.MessagesView
    if(this.node.scrollHeight - this.node.scrollTop - 10 <= this.node.clientHeight) {
      this.setState({
        unreadMessages: 0
      })
    }
  }

  onScrollToBottom() {
    UIActions.focusOnSendMessage()
    this.node.scrollTop = this.node.scrollHeight + this.node.clientHeight
  }

  onShowProfile(user, evt) {
    evt.persist()
    evt.stopPropagation()
    // console.log("PROFILE", user, evt)
    if(!this.state.showUserProfile || (this.state.showUserProfile && user.id !== this.state.showUserProfile.id)) {

      var body = document.body, html = document.documentElement
      var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)

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

      const x = 0
      const y = 0

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
    console.log("REPLYTO", message)
    this.setState({ replyto: message })
    UIActions.focusOnSendMessage()
  }

  onClearReplyTo() {
    console.log("CLEAR REPLYTO")
    this.setState({ replyto: null })
    UIActions.focusOnSendMessage()
  }

  onOpenFeed(user) {
    this.setState({ replyto: null })
    NetworkActions.joinChannel("--planet-express." + user.id)
  }

  _removePost(hash) {
    console.log("!!!", hash)
    ChannelActions.removeMessage(this.state.channelName, hash)
  }

  renderMessages(renderReplyField) {
    const { messages, username, channelName, loading, loadingText, reachedChannelStart, appSettings } = this.state
    const { colorifyUsernames, useEmojis, useMonospaceFont, font, monospaceFont, spacing } = appSettings
    const elements = messages.map((message) => {
      return <div>
        <Message
          currentUserId={this.state.user.id}
          replies={this.state.replies[message.payload.value] || []}
          message={message.payload.value}
          key={message.hash}
          onReplyTo={this.onReplyTo.bind(this)}
          onShowProfile={this.onOpenFeed.bind(this)}
          onDragEnter={this.onDragEnter.bind(this)}
          highlightWords={username}
          colorifyUsername={colorifyUsernames}
          useEmojis={useEmojis}
          onRemove={this._removePost.bind(this, message.hash)}
          style={{
            fontFamily: useMonospaceFont ? monospaceFont : font,
            fontSize: useMonospaceFont ? '0.9em' : '1.0em',
            fontWeight: useMonospaceFont ? '100' : '300',
          }}
        />
        {renderReplyField && renderReplyField.hash === message.payload.value
          ? this.renderInput(true, false, this.state.replyto)
          : null
        }
      </div>
    })
    elements.push(
      <div className="firstMessage" key="firstMessage" onClick={this.loadOlderMessages.bind(this)}>
        {loadingText}
      </div>
    )
    return elements
  }

  renderInput(embedded = false, disabled = false, replyto) {
    return <ChannelControls
      embedded={embedded}
      disabled={disabled}
      onSendMessage={this.sendMessage.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onClearReplyTo={this.onClearReplyTo.bind(this)}
      appSettings={this.state.appSettings}
      isLoading={true}
      theme={null}
      replyto={replyto}
    />
  }

  renderFileDrop() {
    const { theme, dragEnter, channelName } = this.state
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
      )
    }
    return null
  }

  render() {
    const {
      unreadMessages,
      replyto,
      channelName,
      user
    } = this.state

    const showControls = channelName && user && channelName.split(".")[1] === user.id
    const controls = showControls ? this.renderInput(false, replyto) : null

    return (
      <div className="Channel" onDragEnter={this.onDragEnter.bind(this)}>
        {controls}
        <NewMessageNotification
          onClick={this.onScrollToBottom.bind(this)}
          unreadMessages={unreadMessages} />
        <div className="Messages" ref="MessagesView" onScroll={this.onScroll.bind(this)}>
          {this.renderMessages(replyto)}
        </div>
        {this.renderFileDrop()}
      </div>
    )
  }

}

export default Channel
