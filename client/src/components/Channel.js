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
      channelInfo: props.channelInfo,
      password: props.password,
      messages: [],
      loading: false,
      // loadingIcon: false,
      loadingText: 'Connecting...',
      reachedChannelStart: false,
      writeMode: true,
      statusMessage: "Public",
      showChannelOptions: false,
      dragEnter: false,
      user: props.user,
      username: props.user ? props.user.username : '',
      // channelInfo: {},
      flipMessageOrder: props.appSettings.flipMessageOrder,
      displayNewMessagesIcon: false,
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme,
      lastCheckedTime: new Date().getTime(),
      messagesSeen: []
    };
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.channel !== this.state.channelName) {
      console.log("Change channel:", nextProps.channel);
      this.setState({ reachedChannelStart: false });
      UIActions.focusOnSendMessage();
      this._getMessages(nextProps.channel);
    }

    // if(nextProps.channelInfo !== {})
    //   this.setChannelStatus(nextProps.channelInfo);

    this.setState({
      channelName: nextProps.channel,
      channelInfo: nextProps.channelInfo,
      user: nextProps.user,
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
      // console.log("---- Loading", loading.length > 0, loading, loadingText, loadingState);
      this.setState({ loading: loading.length > 0, loadingText: loadingText });
    }
  }

  _onError(errorMessage) {
    this.setState({ statusMessage: errorMessage });
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
      // console.log("check", node.scrollTop, node.clientHeight, node.scrollHeight)
      if(!this.state.flipMessageOrder && node && (node.scrollTop + node.clientHeight + margin) >= node.scrollHeight) {
        this.loadOlderMessages();
      // } else if(this.state.flipMessageOrder && node && ((node.scrollTop - margin) <= 0 || node.clientHeight >= node.scrollHeight)) {
      } else if(this.state.flipMessageOrder && node && (node.scrollTop - margin <= 0 || node.scrollHeight === node.clientHeight)) {
        // console.log("load more 1", node.scrollTop, node.clientHeight, node.scrollHeight)
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

  /* CHANNEL MODES */
  // Public,      // open to all, default mode
  // Private,     // will not show up in search result (not used atm)
  // Secret,      // require password to enter
  // Moderated    // only ops can talk
  setChannelStatus(channelInfo) {
    this.setState({ channelInfo: channelInfo });

    var modes  = channelInfo.modes;
    var status = "Public";

    if(modes) {
      if(modes.w && this.state.user && !_.includes(modes.w.ops, this.state.user.id))
        this.setState({ writeMode: false });
      else
        this.setState({ writeMode: true });

      if(modes.r) status = "Secret";
      if(modes.w) status = "Moderated";
      if(modes.r && modes.w) status = "Private";
    }
    this.setState({ statusMessage: status });
  }

  onNewMessages(channel: string, messages: array) {
    if(channel !== this.state.channelName)
      return;

    // if(this.state.flipMessageOrder) messages = _.sortByOrder(messages, ["ts"], ["asc"]);
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

    // this.setState({ messages: messages, loading: false });
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

  changePasswords(event) {
    event.preventDefault();
    var newReadPassword  = this.refs.readPassword.value.trim();
    var moderated        = this.refs.writePassword.checked;
    var newModes         = [];

    if(!this.state.channelInfo.modes.r && newReadPassword !== ''
      || this.state.channelInfo.modes.r && newReadPassword !== this.state.channelInfo.modes.r.password)
      newModes.push({ mode: "+r", params: { password: newReadPassword } });
    else if(this.state.channelInfo.modes.r && newReadPassword === '')
      newModes.push({ mode: "-r" });
    // else if()
    //   newModes.push({ mode: "+r", params: { password: newReadPassword } });

    if(!this.state.channelInfo.modes.w && moderated)
      newModes.push({ mode: "+w", params: { ops: [this.state.user.id] } });
    else if(this.state.channelInfo.modes.w && !moderated)
      newModes.push({ mode: "-w" });

    if(newModes.length > 0)
      ChannelActions.setChannelMode(this.state.channelName, newModes);

    this.setState({ showChannelOptions: !this.state.showChannelOptions });
  }

  showChannelOptions(event) {
    // event.preventDefault();
    // if(this.state.writeMode) {
    //   this.setState({ showChannelOptions: !this.state.showChannelOptions });
    //   if(this.state.showChannelOptions) {
    //     this.refs.readPassword.value = this.state.password ? this.state.password : '';
    //     // this.refs.writePassword.value = '';
    //   }
    // }
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

  // onHighlight(message) {
  //   if(message.ts > this.state.lastCheckedTime) {
  //     console.log("Mention! Do something with it");
  //     this.setState({ lastCheckedTime: new Date().getTime() });
  //     NotificationActions.newHighlight(this.state.channelName);
  //   }
  // }

  render() {
    document.title = (this.state.unreadMessages > 0 ?  " (" + this.state.unreadMessages + ")" : "") + "#" + this.state.channelName;
    var theme = this.state.theme;
    var showChannelOptions = this.state.showChannelOptions ? "ChannelOptions" : "none";

    var statusMessage = this.state.statusMessage != null ? (
      <div
        className={"statusMessage" + (this.state.showChannelOptions || !this.state.writeMode ? " active" : "")}
        onClick={this.showChannelOptions.bind(this)}
        style={theme}>
        {this.state.statusMessage}
      </div>
    ) : null;

    var controlsBar = this.state.writeMode ? (
      <TransitionGroup
        component="div"
        transitionName="controlsAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <div className="Controls" key="controls">
          <SendMessage onSendMessage={this.sendMessage.bind(this)} key="SendMessage" username={this.state.username} theme={theme}/>
          <Dropzone className="dropzone2" onDrop={this.onDrop.bind(this)} key="dropzone2">
            <div className="icon flaticon-tool490" style={theme} key="icon"/>
          </Dropzone>
        </div>
      </TransitionGroup>
    ) : (<div></div>);

    var messages = this.state.messages.map((e) => {
      return <Message
                message={e}
                key={e.hash}
                onDragEnter={this.onDragEnter.bind(this)}
                username={this.state.username}
                colorifyUsername={this.state.appSettings.colorifyUsernames}
                useEmojis={this.state.appSettings.useEmojis}
                // onHighlight={this.onHighlight.bind(this)}
              />;
    });

    var firstMessageText = this.state.loading && this.state.loadingText ? this.state.loadingText : `Older messages...`;

    if(this.state.reachedChannelStart)
      firstMessageText = `Beginning of # ${this.state.channelName}`;

    messages.unshift(<div className="firstMessage" key="firstMessage">{firstMessageText}</div>);

    var channelOptions = this.state.showChannelOptions ? (
      <div className="ChannelOptions">
        <div className="row">
          <div className="headerText">CHANNEL ACCESS</div>
          <div className="instructionText">
            By setting the read password, you make the channel private and only people who know the password can join.
            By setting the write password, only you can post to the channel.
          </div>
        </div>
        <form onSubmit={this.changePasswords.bind(this)}>
          <input type="text" ref="readPassword" placeholder="read-password" defaultValue={this.state.channelInfo.modes.r ? this.state.channelInfo.modes.r.password : ''} style={theme}/>
          <label>Moderated</label> <input type="checkbox" ref="writePassword" defaultChecked={this.state.channelInfo.modes.w} style={theme}/>
          <input type="submit" value="Set" style={theme}/>
        </form>
      </div>
    ) : null;

    var dropzone = this.state.dragEnter ? (
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

    var showNewMessageNotification = this.state.displayNewMessagesIcon ? (
      <div className="newMessagesBar" onClick={this.onScrollToBottom.bind(this)}>
        There are <span className="newMessagesNumber">{this.state.unreadMessages}</span> new messages
      </div>
    ) : (<span></span>);

    var channelStyle  = this.state.flipMessageOrder ? "Channel flipped" : "Channel";
    var messagesStyle = this.state.flipMessageOrder ? "Messages" : "Messages flopped";
    var color         = 'rgba(255, 255, 255, 0.7)';
    var loadingIcon   = this.state.loading ? (
      <div className="loadingBar">
        <Halogen.MoonLoader className="loadingIcon" color={color} size="16px"/>
      </div>
    ) : "";
/*
  For messages:
  <TransitionGroup
    transitionName="messagesAnimation"
    transitionAppear={false}
    transitionEnter={true}
    transitionLeave={false}
    transitionAppearTimeout={500}
    transitionEnterTimeout={500}
    transitionLeaveTimeout={100}
    component="div">
    {messages}
  </TransitionGroup>
*/
    return (
      <div className={channelStyle} onDragEnter={this.onDragEnter.bind(this)}>

        <div className={messagesStyle} ref="MessagesView" onScroll={this.onScroll.bind(this)} >
          {messages}
        </div>

        {channelOptions}

        {showNewMessageNotification}
        {controlsBar}

        {dropzone}
        {loadingIcon}
        {statusMessage}
      </div>
    );
  }

}

export default Channel;
