'use strict';

import React from 'react';
import EmojiPicker from './EmojiPicker'
import Actions from "actions/UIActions";
import AutoCompleter from "./AutoCompleter.js";
import 'styles/SendMessage.scss';
import UsersStore from 'stores/UsersStore';

class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.autoComplete = new AutoCompleter();
    this.autoComplete.onUpdated = (text) => this.refs.message.value = text;
    this.state = {
      theme: props.theme,
      useEmojis: props.useEmojis,
      emojiPickerActive: false,
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
    this.setState({ theme: nextProps.theme });
  }

  sendMessage(event) {
    event.preventDefault();
    var text = this.refs.message.value.trim();
    this.props.onSendMessage(text);
    this.refs.message.value = '';
    this.refs.message.focus();
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
    this.autoComplete.onKeyDown(event, this.refs.message.value, UsersStore.users);
    if (this.state.emojiPickerActive) {
      this.refs.emojipicker.onKeyDown(event);
    }
  }

  render() {
    const emojiPicker = this.state.emojiPickerActive ?
    <EmojiPicker ref='emojipicker'
      elemsPerRow={8}
      filterText={this.state.lastWord}
      onClose={this.onCloseEmojiPicker.bind(this)}
      onSelectEmoji={this.onSelectEmoji.bind(this)}/> : <span/>
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
