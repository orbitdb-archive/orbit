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
      replyto: props.replyto,
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
    this.autoComplete.onKeyDown(event, this.refs.message.value, UsersStore.users);
    if (this.state.emojiPickerActive) {
      this.refs.emojipicker.onKeyDown(event);
    }
  }

  onClearReplyTo() {
    this.props.onClearReplyTo()
  }

  render() {
    const { replyto, lastWord, emojiPickerActive, theme } = this.state

    const emojiPicker = emojiPickerActive ?
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
          filterText={lastWord}
          onClose={this.onCloseEmojiPicker.bind(this)}
          onSelectEmoji={this.onSelectEmoji.bind(this)}/>
      </TransitionGroup>
      : <span/>

    const inputLabel = replyto
      ? <div
          className="InputMessage"
          onClick={this.onClearReplyTo.bind(this)}
        >
          {replyto ? `Reply to:  "<${replyto.user.name}> ${replyto.content}"` : ""}
        </div>
      : null

    return (
      <div className="SendMessage">
        {inputLabel}
        <form onSubmit={this.sendMessage.bind(this)}>
          {emojiPicker}
          <input
            type="text"
            ref="message"
            placeholder={replyto ? "Type your response..." : "What's up?"}
            style={theme}
            onKeyDown={this.onKeyDown.bind(this)}
            onInput={this.onInput.bind(this)}
            />
        </form>
      </div>
    );
  }
}

export default SendMessage;
