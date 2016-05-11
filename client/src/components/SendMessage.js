'use strict';

import React from 'react';
import EmojiPicker from './EmojiPicker'
import Actions from "actions/UIActions";
<<<<<<< HEAD
import AutoCompleter from "./AutoCompleter.js";
import { filterEmojis } from "../utils/emojis";
=======
>>>>>>> Moved key handling to emojipicker
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
      emojiPickerActive: false
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

  hideEmojiPicker() {
      this.setState({
          ...this.state,
          emojiPickerActive : false
      });
  }
  onKeyUp(event) {
      if (this.state.emojiPickerActive){
          if (event.which === 9) {
              this.refs.emojipicker.onKeyUp(event);
          } else {
              const lastWord = this.refs.message.value.split(" ").pop();
              this.refs.emojipicker.filterWord(lastWord);
          }
      }
  }

  onKeyDown(event) {
    this.autoComplete.onKeyDown(event, this.refs.message.value, UsersStore.users);

    // console.log("KEYDOWN", event.type, event.which);
    if (this.state.emojiPickerActive) {
        this.refs.emojipicker.onKeyDown(event);
    }
    if(event.which === 9) {
      // Tab
      event.preventDefault();
      // TODO: autocomplete user names
    } else if(event.which === 186) {
      // ':'
      if (this.props.useEmojis) {
         this.setState({
             ...this.state,
             emojiPickerActive : true
         });
      }
  }
    return;
  }
  displayEmojiText (emojiText) {
      let text = this.refs.message.value.split(" ");
      text.pop();
      text.push(emojiText);
      this.refs.message.value = text.join(" ");
  }

  render() {
    return (
      <div className="SendMessage">
        <form onSubmit={this.sendMessage.bind(this)}>
            {this.props.useEmojis &&
             this.state.emojiPickerActive ?
                 <EmojiPicker ref='emojipicker'
                     hideEmojiPicker={this.hideEmojiPicker.bind(this)}
                     displayEmojiText={this.displayEmojiText.bind(this)}/> : null}
          <input
            type="text"
            ref="message"
            placeholder="Type a message..."
            autoComplete={true}
            style={this.state.theme}
            onKeyDown={this.onKeyDown.bind(this)}
            onKeyUp={this.onKeyUp.bind(this)}
            />
        </form>
      </div>
    );
  }
}

export default SendMessage;
