'use strict';

import _ from 'lodash';
import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import Message from 'components/Message';
import SendMessage from 'components/SendMessage';
import Dropzone from 'react-dropzone';
import MessageStore from 'stores/MessageStore';
import LoadingStateStore from 'stores/LoadingStateStore';
import UIActions from 'actions/UIActions';
import ChannelActions from 'actions/ChannelActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import Halogen from 'halogen';
import 'styles/Channel.scss';

class Channel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      channelName: props.channel,
      messages: [],
      loading: false,
      loadingText: 'Connecting...',
      reachedChannelStart: false,
      writeMode: true,
      channelMode: "Public",
      error: null,
      dragEnter: false,
      username: props.user ? props.user.username : '',
      flipMessageOrder: props.appSettings.flipMessageOrder,
      displayNewMessagesIcon: false,
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme
    };
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.channel !== this.state.channelName) {
      this.setState({ reachedChannelStart: false });
      UIActions.focusOnSendMessage();
      this._getMessages(nextProps.channel);
    }

    this.setState({
      channelName: nextProps.channel,
      username: nextProps.user ? nextProps.user.username : '',
      appSettings: nextProps.appSettings,
      theme: nextProps.theme,
      flipMessageOrder: nextProps.appSettings.flipMessageOrder
    });
  }

  _getMessages(channel) {
    const messages = MessageStore.getMessages(channel);
    this.setState({ messages: messages });
  }

  _onLoadStateChange(state) {
    const loadingState = state[this.state.channelName];
    if(loadingState) {
      const loading = Object.keys(loadingState).filter((f) => loadingState[f] && loadingState[f].loading);
      const loadingText = loadingState[loading[0]] ? loadingState[loading[0]].message : null;
      this.setState({ loading: loading.length > 0, loadingText: loadingText });
    }
  }

  _onError(errorMessage) {
    this.setState({ error: errorMessage });
  }

  _onReachedChannelStart() {
    this.setState({ reachedChannelStart: true });
  }

  componentDidMount() {
    this._getMessages(this.state.channelName);

    this.unsubscribeFromMessageStore = MessageStore.listen(this.onNewMessages.bind(this));
    this.stopListeningLoadingState = LoadingStateStore.listen(this._onLoadStateChange.bind(this));
    this.stopListeningChannelState = ChannelActions.reachedChannelStart.listen(this._onReachedChannelStart.bind(this));
    this.unsubscribeFromErrors = UIActions.raiseError.listen(this._onError.bind(this));

    this.node = this.refs.MessagesView;
    this.scrollHeight = 0;
    const margin = 20;
    this.timer = setInterval(() => {
      var node = this.node;
      if(!this.state.flipMessageOrder && node && (node.scrollTop + node.clientHeight + margin) >= node.scrollHeight) {
        this.loadOlderMessages();
      } else if(this.state.flipMessageOrder && node && (node.scrollTop - margin <= 0 || node.scrollHeight === node.clientHeight)) {
        this.loadOlderMessages();
      }
    }, 500);
  }

  componentWillUnmount() {
    this.unsubscribeFromMessageStore();
    this.unsubscribeFromErrors();
    this.stopListeningLoadingState();
    this.stopListeningChannelState();
    this.setState({ messages: [] });
    clearInterval(this.timer);
  }

  onNewMessages(channel: string, messages: array) {
    if(channel !== this.state.channelName)
      return;

    if(this.state.flipMessageOrder && this.node.scrollHeight - this.node.scrollTop + 20 > this.node.clientHeight && this.node.scrollHeight > this.node.clientHeight + 1
      && this.state.messages.length > 0 && messages[messages.length - 1].meta.ts > this.state.messages[this.state.messages.length - 1].meta.ts
      && this.node.scrollHeight > 0) {
      this.setState({
        displayNewMessagesIcon: true,
        unreadMessages: this.state.unreadMessages + 1
      });
    }

    if(!this.state.flipMessageOrder && this.node.scrollTop > 0
      && this.state.messages.length > 0 && messages[0].meta.ts > this.state.messages[0].meta.ts) {
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
    if(!this.state.loading)
      ChannelActions.loadMoreMessages(this.state.channelName);
  }

  componentWillUpdate() {
    const node = this.refs.MessagesView;
    const margin = 20;

    if(!this.state.flipMessageOrder) {
      this.shouldScroll = (node.scrollHeight - this.scrollHeight) > 0 && node.scrollTop > 0;
    } else {
      this.shouldScroll = this.scrollHeight < node.scrollHeight && node.scrollTop > (0 + margin);
      this.scrollAmount = node.scrollHeight - this.scrollHeight;
      this.shouldScrollToBottom = (node.scrollTop + node.clientHeight + margin) >= this.scrollHeight;
    }

    this.scrollTop = node.scrollTop;
    this.scrollHeight = node.scrollHeight;
  }

  componentDidUpdate() {
    const node = this.refs.MessagesView;
    if(!this.state.flipMessageOrder && this.shouldScroll) {
      node.scrollTop = this.scrollTop + this.scrollAmount;
    } else if(this.state.flipMessageOrder && !this.shouldScroll) {
      node.scrollTop = this.scrollTop + this.scrollAmount;
    }

    if((this.state.flipMessageOrder && this.shouldScrollToBottom)) {
      node.scrollTop = node.scrollHeight + node.clientHeight;
    }
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
  }

  onDragEnter(event) {
    this.setState({ dragEnter: true });
  }

  onDragLeave() {
    this.setState({ dragEnter: false });
  }

  onScroll(event) {
    var node = this.node;
    if(this.state.flipMessageOrder && node.scrollHeight - node.scrollTop - 10 <= node.clientHeight) {
      this.setState({ displayNewMessagesIcon: false, unreadMessages: 0 });
    }
    else if(!this.state.flipMessageOrder && node.scrollTop === 0) {
      this.setState({ displayNewMessagesIcon: false, unreadMessages: 0 });
    }
  }

  onScrollToBottom() {
    var node = this.node;
    node.scrollTop = this.state.flipMessageOrder ? node.scrollHeight + node.clientHeight : 0;
  }

  render() {
    document.title = (this.state.unreadMessages > 0 ?  " (" + this.state.unreadMessages + ")" : "") + "#" + this.state.channelName;
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

    const channelStyle  = this.state.flipMessageOrder ? "Channel flipped" : "Channel";
    const messagesStyle = this.state.flipMessageOrder ? "Messages" : "Messages flopped";
    const color         = 'rgba(255, 255, 255, 0.7)';
    const loadingIcon   = this.state.loading ? (
      <div className="loadingBar">
        <Halogen.MoonLoader className="loadingIcon" color={color} size="16px"/>
      </div>
    ) : "";

    return (
      <div className={channelStyle} onDragEnter={this.onDragEnter.bind(this)}>
        <div className={messagesStyle} ref="MessagesView" onScroll={this.onScroll.bind(this)} >
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
