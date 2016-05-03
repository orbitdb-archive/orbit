'use strict';

import _ from 'lodash';
import React from 'react';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
import Message from 'components/Message'; //eslint-disable-line
import SendMessage from 'components/SendMessage'; //eslint-disable-line
import Dropzone from 'react-dropzone'; //eslint-disable-line
import MessageStore from 'stores/MessageStore';
import LoadingStateStore from 'stores/LoadingStateStore';
import UIActions from 'actions/UIActions';
import ChannelActions from 'actions/ChannelActions';
import Halogen from 'halogen'; //eslint-disable-line
import 'styles/Channel.scss';

class Channel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      channelChanged: true,
      channelName: props.channel,
      messages: [],
      loading: false,
      loadingText: 'Syncing...',
      reachedChannelStart: false,
      channelMode: "Public",
      error: null,
      dragEnter: false,
      username: props.user ? props.user.username : '',
      displayNewMessagesIcon: false,
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme
    };

    this.scrollTimer = null;
    this.topMargin = 120;
    this.bottomMargin = 20;
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.channel !== this.state.channelName) {
      this.setState({
        channelChanged: true,
        displayNewMessagesIcon: false,
        reachedChannelStart: false
      });
      UIActions.focusOnSendMessage();
      console.log("======================================================")
      this._getMessages(nextProps.channel);
    }

    this.setState({
      channelName: nextProps.channel,
      username: nextProps.user ? nextProps.user.username : '',
      appSettings: nextProps.appSettings,
      theme: nextProps.theme
    });
  }

  _getMessages(channel) {
    const messages = MessageStore.getMessages(channel);
    this.setState({ messages: messages });
  }

  _onLoadStateChange(state) {
    const loadingState = state[this.state.channelName];
    console.log("STATE", state)
    if(loadingState) {
      const loading = Object.keys(loadingState).filter((f) => loadingState[f] && loadingState[f].loading);
      const loadingText = loadingState[loading[0]] ? loadingState[loading[0]].message : null;
      this.setState({ loading: loading.length > 0, loadingText: loadingText });
    }
  }

  _onError(errorMessage) {
    console.error("Channel:", errorMessage);
    this.setState({ error: errorMessage });
  }

  _onReachedChannelStart() {
    this.setState({ reachedChannelStart: true });
  }

  componentDidMount() {

    this.unsubscribeFromMessageStore = MessageStore.listen(this.onNewMessages.bind(this));
    this.stopListeningLoadingState = LoadingStateStore.listen(this._onLoadStateChange.bind(this));
    this.stopListeningChannelState = ChannelActions.reachedChannelStart.listen(this._onReachedChannelStart.bind(this));
    this.unsubscribeFromErrors = UIActions.raiseError.listen(this._onError.bind(this));

    this.node = this.refs.MessagesView;
    this._getMessages(this.state.channelName);
    // this._getMessages(this.state.channel);
    this.loadOlderMessages();
  }

  componentWillUnmount() {
    clearTimeout(this.scrollTimer);
    this.unsubscribeFromMessageStore();
    this.unsubscribeFromErrors();
    this.stopListeningLoadingState();
    this.stopListeningChannelState();
    this.setState({ messages: [] });
  }

  onNewMessages(channel: string, messages) {
    if(channel !== this.state.channelName)
      return;

    this.node = this.refs.MessagesView;
    if(this.node.scrollHeight - this.node.scrollTop + this.bottomMargin > this.node.clientHeight
      && this.node.scrollHeight > this.node.clientHeight + 1
      && this.state.messages.length > 0 && _.last(messages).meta.ts > _.last(this.state.messages).meta.ts
      && this.node.scrollHeight > 0) {
      this.setState({
        displayNewMessagesIcon: true,
        unreadMessages: this.state.unreadMessages + 1
      });
    }

    this.setState({ messages: messages });
  }

  sendMessage(text: string) {
    if(text !== '')
      ChannelActions.sendMessage(this.state.channelName, text);
  }

  sendFile(filePath: string) {
    if(filePath !== '')
      ChannelActions.addFile(this.state.channelName, filePath);
  }

  loadOlderMessages() {
    console.log("load", this.state.loading)
    if(!this.state.loading)
      ChannelActions.loadMoreMessages(this.state.channelName);
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

    console.log("----------- abcdefghaöljsd -----------", this._shouldLoadMoreMessages())
    if(this._shouldLoadMoreMessages())
      this.loadOlderMessages();
  }

  _shouldLoadMoreMessages() {
    return this.node && (this.node.scrollTop - this.topMargin <= 0 || this.node.scrollHeight === this.node.clientHeight);
  }

  onDrop(files) {
    this.setState({ dragEnter: false });
    console.log('Dropped files: ', files);
    files.forEach((file) => {
      if(file.path)
        this.sendFile(file.path);
      else
        console.error("File upload not yet implemented in browser. Try the electron app.");
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
    this.scrollTimer = setTimeout(() => {
      if(this._shouldLoadMoreMessages())
        this.loadOlderMessages();
    }, 800);

    // If we scrolled to the bottom, hide the "new messages" label
    this.node = this.refs.MessagesView;
    if(this.node.scrollHeight - this.node.scrollTop - 10 <= this.node.clientHeight) {
      this.setState({ displayNewMessagesIcon: false, unreadMessages: 0 });
    }
  }

  onScrollToBottom() {
    UIActions.focusOnSendMessage();
    this.node.scrollTop = this.node.scrollHeight + this.node.clientHeight;
  }

  render() {
    const theme = this.state.theme;
    const channelMode = (<div className={"statusMessage"} style={theme}>{this.state.channelMode}</div>);

    const controlsBar = (
      <TransitionGroup
        component="div"
        transitionName="controlsAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <div className="Controls" key="controls">
          <SendMessage onSendMessage={this.sendMessage.bind(this)} key="SendMessage" theme={theme}/>
          <Dropzone className="dropzone2" onDrop={this.onDrop.bind(this)} key="dropzone2">
            <div className="icon flaticon-tool490" style={theme} key="icon"/>
          </Dropzone>
        </div>
      </TransitionGroup>
    );

    const messages = this.state.messages.map((e) => {
      return <Message
                message={e}
                key={e.hash}
                onDragEnter={this.onDragEnter.bind(this)}
                highlightWords={this.state.username}
                colorifyUsername={this.state.appSettings.colorifyUsernames}
                useEmojis={this.state.appSettings.useEmojis}
              />;
    });

    let channelStateText = this.state.loading && this.state.loadingText ? this.state.loadingText : `Older messages...`;
    if(this.state.reachedChannelStart)
      channelStateText = `Beginning of # ${this.state.channelName}`;

    messages.unshift(<div className="firstMessage" key="firstMessage">{channelStateText}</div>);

    const fileDrop = this.state.dragEnter ? (
      <Dropzone
        className="dropzone"
        activeClassName="dropzoneActive"
        disableClick={true}
        onDrop={this.onDrop.bind(this)}
        onDragEnter={this.onDragEnter.bind(this)}
        onDragLeave={this.onDragLeave.bind(this)}
        style={theme}
        key="dropzone"
        >
        <div ref="dropLabel" style={theme}>Add files to #{this.state.channelName}</div>
      </Dropzone>
    ) : "";

    const showNewMessageNotification = this.state.displayNewMessagesIcon ? (
      <div className="newMessagesBar" onClick={this.onScrollToBottom.bind(this)}>
        There are <span className="newMessagesNumber">{this.state.unreadMessages}</span> new messages
      </div>
    ) : (<span></span>);

    const loadingIcon = this.state.loading ? (
      <div className="loadingBar">
        <Halogen.MoonLoader className="loadingIcon" color="rgba(255, 255, 255, 0.7)" size="16px"/>
      </div>
    ) : "";

    return (
      <div className="Channel flipped" onDragEnter={this.onDragEnter.bind(this)}>
        <div className="Messages" ref="MessagesView" onScroll={this.onScroll.bind(this)} >
          {messages}
        </div>
        {showNewMessageNotification}
        {controlsBar}
        {fileDrop}
        {loadingIcon}
        {channelMode}
      </div>
    );
  }

}

export default Channel;
