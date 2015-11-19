'use strict';

import _            from 'lodash';
import React        from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import Message      from 'components/Message';
import SendMessage  from 'components/SendMessage';
import Dropzone     from 'react-dropzone';
import MessageStore from 'stores/MessageStore';
import UIActions    from 'actions/SendMessageAction';
import ChannelActions from 'actions/ChannelActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';
import Halogen      from 'halogen';
import 'styles/Channel.scss';

class Channel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      channelName: props.channel,
      password: props.password,
      messages: [],
      loading: false,
      loadingIcon: false,
      writeMode: false,
      statusMessage: null,
      showChannelOptions: false,
      dragEnter: false,
      username: props.username,
      channelInfo: {},
      flipMessageOrder: props.appSettings.flipMessageOrder,
      displayNewMessagesIcon: false,
      unreadMessages: 0,
      appSettings: props.appSettings,
      theme: props.theme
    };
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.channel !== this.state.channelName)
      this.setState({ messages: [] });

    this.setState({
      loading: false,
      channelName: nextProps.channel,
      appSettings: nextProps.appSettings,
      theme: nextProps.theme,
      flipMessageOrder: nextProps.appSettings.flipMessageOrder
    });
    NetworkActions.getChannelInfo(nextProps.channel);
  }

  componentDidMount() {
    this.unsubscribeFromMessageStore = MessageStore.listen(this.onNewMessages.bind(this));
    this.unsubscribeFromErrors       = UIActions.raiseError.listen((errorMessage) => this.setState({ statusMessage: errorMessage }));
    this.unsubscribeFromChannelInfo  = ChannelActions.channelInfoReceived.listen(this.setChannelStatus.bind(this));
    this.unsubscribeFromStartLoading = UIActions.startLoading.listen((channel) => {
      if(!this.state.channelInfo.new && channel === this.state.channelName)
        this.setState({ loadingIcon: true });
    });
    this.unsubscribeFromStopLoading = UIActions.stopLoading.listen((channel) => {
      if(channel === this.state.channelName)
        this.setState({ loadingIcon: false });
    });

    this.node = this.refs.MessagesView;
    this.scrollHeight = 0;
    this.timer = setInterval(() => {
      var node = this.node;
      if(!this.state.flipMessageOrder && node && (node.scrollTop + node.clientHeight + 20) >= node.scrollHeight) {
        this.loadOlderMessages();
      } else if(this.state.flipMessageOrder && node && ((node.scrollTop - 1) <= 0 || node.clientHeight >= node.scrollHeight)
        && (_.last(this.state.messages) && _.last(this.state.messages).seq > 1)) {
        this.loadOlderMessages();
      }
    }, 100);

    NetworkActions.getChannelInfo(this.state.channelName);
  }

  componentWillUnmount() {
    this.unsubscribeFromMessageStore();
    this.unsubscribeFromErrors();
    this.unsubscribeFromChannelInfo();
    this.unsubscribeFromStartLoading();
    this.unsubscribeFromStopLoading();
    this.setState({ messages: [], loading: false });
    clearInterval(this.timer);
  }

  /* CHANNEL MODES */
  // Public,      // open to all, default mode
  // Private,     // will not show up in search result (not used atm)
  // Secret,      // require password to enter
  // Moderated    // only ops can talk
  setChannelStatus(channelInfo) {
    this.setState({ channelInfo: channelInfo });
    var info = channelInfo;

    if(info.write && !info.owner) this.setState({ writeMode: false });
    else this.setState({ writeMode: true });

    var status = "";
    // if(info.new)   status += "This channel is empty. ";
    if(info.read)  status = "Secret";
    if(info.write) status = "Moderated";
    if(info.read && info.write)  status = "Private";
    // if(info.write && info.owner)  status += "You're a moderator of this channel. ";
    // if(info.write && !info.owner) status += "Only the moderators of this channel can send messages. ";
    if(status === "") status = "Public";
    this.setStatusMessage(status);
  }

  onNewMessages(channel, messages) {
    if(channel !== this.state.channelName)
      return;

    var sorted = messages;
    if(this.state.flipMessageOrder) sorted = _.sortByOrder(messages, ["ts"], ["asc"]);

    if(this.state.flipMessageOrder && this.node.scrollHeight - this.node.scrollTop + 20 > this.node.clientHeight && this.node.scrollHeight > this.node.clientHeight + 1
      && this.state.messages.length > 0 && sorted[sorted.length - 1].ts > this.state.messages[this.state.messages.length - 1].ts
      && this.node.scrollHeight > 0) {
      this.setState({
        displayNewMessagesIcon: true,
        unreadMessages: this.state.unreadMessages + 1
      });
    }

    if(!this.state.flipMessageOrder && this.node.scrollTop > 0
      && this.state.messages.length > 0 && sorted[0].ts > this.state.messages[0].ts) {
      this.setState({
        displayNewMessagesIcon: true,
        unreadMessages: this.state.unreadMessages + 1
       });
    }

    this.setState({
      messages: sorted,
      loading: false
    });

    if(this.state.channelInfo.new) NetworkActions.getChannelInfo(this.state.channelName);
  }

  sendMessage(message) {
    if(message !== '')
      ChannelActions.sendMessage(this.state.channelName, message);
  }

  sendFile(filePath) {
    if(filePath !== '')
      ChannelActions.addFile(this.state.channelName, filePath);
  }

  loadOlderMessages() {
    if(!this.state.loading && !this.state.channelInfo.new) {
      this.setState({ loading: true });
      ChannelActions.loadOlderMessages(this.state.channelName);
    }
  }

  componentWillUpdate() {
    var node    = this.refs.MessagesView;
    var padding = 0;

    if(!this.state.flipMessageOrder) {
      // this.shouldScroll = node.scrollTop > 0 && this.scrollHeight < node.scrollHeight;
      this.shouldScroll = (node.scrollHeight - this.scrollHeight) > 0 && node.scrollTop > 0;
    } else {
      var newHeight             = this.scrollHeight + (node.scrollHeight - this.scrollHeight);
      this.shouldScroll         = (newHeight >= node.scrollHeight - 10 && this.scrollTop > node.scrollTop) && (this.scrollTop > 0 || node.scrollTop > 0);
      this.shouldScrollToBottom = (node.scrollTop + node.clientHeight + 20) >= this.scrollHeight;
    }

    this.toScroll     = (node.scrollHeight - this.scrollHeight);
    this.scrollTop    = node.scrollTop;
    this.clientHeight = node.clientHeight;
    this.scrollHeight = node.scrollHeight;
    // console.log(this.shouldScroll);
  }

  componentDidUpdate() {
    var node = this.refs.MessagesView;
    if(!this.state.flipMessageOrder && this.shouldScroll) {
      // console.log(this.scrollTop, node.scrollTop, this.scrollHeight, node.scrollHeight, this.clientHeight, node.clientHeight, this.toScroll);
      // node.scrollTop = this.scrollTop + (node.scrollHeight - this.scrollHeight) + this.toScroll;
      node.scrollTop = this.scrollTop + this.toScroll;
    } else if(this.state.flipMessageOrder && !this.shouldScroll) {
      node.scrollTop = this.scrollTop + this.toScroll;
      // node.scrollTop = this.scrollTop + (node.scrollHeight - this.scrollHeight);
    }
    if(this.state.flipMessageOrder && this.shouldScrollToBottom) {
      node.scrollTop = node.scrollHeight + node.clientHeight;
    }
  }

  changePasswords(event) {
    event.preventDefault();
    var newReadPassword  = this.refs.readPassword.value.trim();
    var newWritePassword = this.refs.writePassword.value.trim();
    this.refs.readPassword.value  = '';
    this.refs.writePassword.value = '';
    this.setState({ showChannelOptions: !this.state.showChannelOptions });
    ChannelActions.setChannelOptions(this.state.channelName, newReadPassword, newWritePassword);
    return;
  }

  showChannelOptions(event) {
    event.preventDefault();
    if(this.state.writeMode) {
      this.setState({ showChannelOptions: !this.state.showChannelOptions });
      if(this.state.showChannelOptions) {
        this.refs.readPassword.value = this.state.password ? this.state.password : '';
        this.refs.writePassword.value = '';
      }
    }
  }

  setStatusMessage(message) {
    this.setState({ statusMessage: message });
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
    document.title = "#" + this.state.channelName + (this.state.unreadMessages > 0 ?  " (" + this.state.unreadMessages + ")" : "");
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
      <TransitionGroup component="div" transitionName="controlsAnimation" transitionAppear={true}>
        <div className="Controls">
          <SendMessage onSendMessage={this.sendMessage.bind(this)} key="SendMessage" username={this.state.username} theme={theme}/>
          <Dropzone className="dropzone2" onDrop={this.onDrop.bind(this)}>
            <div className="icon flaticon-tool490" style={theme}/>
          </Dropzone>
        </div>
      </TransitionGroup>
    ) : (<div></div>);

    var messages = this.state.messages.map((e) => {
      return <Message
                message={e.data}
                key={e.ts}
                onDragEnter={this.onDragEnter.bind(this)}
                username={this.state.username}
                colorifyUsername={this.state.appSettings.colorifyUsernames}
                useEmojis={this.state.appSettings.useEmojis}
              />;
    });

    var firstMessageText = "Beginning of #" + this.state.channelName;
    if(this.state.messages[this.state.messages.length - 1] && this.state.messages[this.state.messages.length - 1].seq === 1 && !this.state.flipMessageOrder)
      messages.push(<div className="firstMessage">{firstMessageText}</div>);
    else if((this.state.channelInfo.new || this.state.messages[0] && this.state.messages[0].seq === 1) && this.state.flipMessageOrder)
      messages.unshift(<div className="firstMessage">{firstMessageText}</div>);

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
          <input type="text" ref="readPassword" placeholder="read-password" defaultValue={this.state.password} style={theme}/>
          <input type="text" ref="writePassword" placeholder="write-password" style={theme}/>
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
        >
        <div ref="dropLabel" style={theme}>Add files to #{this.state.channelName}</div>
      </Dropzone>
    ) : "";

    var showNewMessageIcon = this.state.displayNewMessagesIcon ? (
      <div className="newMessagesBar" onClick={this.onScrollToBottom.bind(this)}>
        There are <span className="newMessagesNumber">{this.state.unreadMessages}</span> new messages
      </div>
    ) : (<span></span>);

    var channelStyle  = this.state.flipMessageOrder ? "Channel flipped" : "Channel";
    var messagesStyle = this.state.flipMessageOrder ? "Messages" : "Messages flopped";
    var color         = 'rgba(255, 255, 255, 0.7)';
    var loadingIcon   = this.state.loadingIcon ? (
      <div className="loadingIcon"><Halogen.MoonLoader color={color} size="16px"/></div>
    ) : "";

    return (
      <div className={channelStyle} onDragEnter={this.onDragEnter.bind(this)}>

        <div className={messagesStyle} ref="MessagesView" onScroll={this.onScroll.bind(this)}>
          {messages}
        </div>

        {showNewMessageIcon}
        {controlsBar}

        <TransitionGroup component="div" transitionName="channelAccessAnimation" transitionEnter={true} transitionLeave={true}>
          {channelOptions}
        </TransitionGroup>

        {dropzone}
        {loadingIcon}
        {statusMessage}
      </div>
    );
  }

}

export default Channel;
