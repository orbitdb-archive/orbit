'use strict';

import React from 'react';
import EmojiPicker from './EmojiPicker'
import Actions from "actions/UIActions";
import AutoCompleter from "./AutoCompleter.js";
import 'styles/SendMessage.scss';
import UsersStore from 'stores/UsersStore';
import TransitionGroup from "react-addons-css-transition-group";

class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.autoComplete = new AutoCompleter();
    this.autoComplete.onUpdated = (text) => this.refs.message.value = text;
    this.state = {
      theme: props.theme,
      useEmojis: props.useEmojis,
      emojiPickerActive: false,
      replyto: null,
      lastWord: null
    };
  }

  componentDidMount() {
    this.unsubscribe = Actions.onPanelClosed.listen(() => this.refs.message.focus());
    this.unsubscribe2 = Actions.focusOnSendMessage.listen(() => this.refs.message.focus());
    this.refs.message.focus();
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.unsubscribe2();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      theme: nextProps.theme,
      replyto: nextProps.replyto
    });
  }

  sendMessage(event) {
    event.preventDefault();
    var text = this.refs.message.value.trim();
    this.props.onSendMessage(text, this.state.replyto);
    this.refs.message.value = '';
    this.refs.message.focus();
    this.setState({ replyto: null })
    return;
  }

  onCloseEmojiPicker() {
    this.setState({ emojiPickerActive : false });
    this.refs.message.focus();
  }

  onSelectEmoji (emojiText) {
    let text = this.refs.message.value.split(' ');
    text.pop();
    text.push(emojiText);
    this.refs.message.value = text.join(' ');
  }

  onInput() {
    const lastWord = this.refs.message.value.split(' ').pop();
    this.setState({ lastWord: lastWord });
    if (lastWord.startsWith(':')) {
      this.setState({ emojiPickerActive: this.props.useEmojis });
    }
  }

  onKeyDown(event) {
    const userNames = Object.keys(UsersStore.users).map((e) => UsersStore.users[e].name)
    this.autoComplete.onKeyDown(event, this.refs.message.value, userNames);
    if (this.state.emojiPickerActive) {
      this.refs.emojipicker.onKeyDown(event);
    }
  }

  render() {
    const emojiPicker = this.state.emojiPickerActive ?
      <TransitionGroup
        component="div"
        transitionName="emojiPreview"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <EmojiPicker ref='emojipicker'
          elemsPerRow={8}
          filterText={this.state.lastWord}
          onClose={this.onCloseEmojiPicker.bind(this)}
          onSelectEmoji={this.onSelectEmoji.bind(this)}/>
      </TransitionGroup>
      : <span/>

    return (
      <div className="SendMessage">
        <form onSubmit={this.sendMessage.bind(this)}>
          {emojiPicker}
          <input
            type="text"
            ref="message"
            placeholder="Type a message..."
            autoComplete={true}
            style={this.state.theme}
            onKeyDown={this.onKeyDown.bind(this)}
            onInput={this.onInput.bind(this)}
            />
        </form>
      </div>
    );
  }
}

export default SendMessage;
