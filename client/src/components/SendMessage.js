'use strict';

import React from 'react';
import EmojiPicker from './EmojiPicker'
import Actions from "actions/UIActions";
import AutoCompleter from "./AutoCompleter.js";
import { filterEmojis } from "../utils/emojis";
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
      emojiSettings: {
          emojiPickerActive: false,
          emojis: [],
          emojiMatchString: '',
          emojiIndex: 0
      }
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
      const emojiSettings = {
          ...this.state.emojiSettings,
          emojis: [],
          emojiIndex: 0,
          emojiPickerActive : false
      };
      this.setState({
          ...this.state,
          emojiSettings: emojiSettings
      });
  }
  onKeyUp(event) {
      if(event.which === 9) {
          if (this.state.emojiSettings.emojiPickerActive){
              this.displayEmojiText();
          }
      } else {
          if (this.state.emojiSettings.emojiPickerActive) {
              const lastWord = this.refs.message.value.split(" ").pop();
              const emojiRe = /^::?[\w\d_\+-]*$/;
              if (emojiRe.test(lastWord)) {
                  const filteredEmojis = filterEmojis(lastWord.slice(1), 50);
                  if (filteredEmojis.length > 0)
                  {
                      const emojiSettings = {
                          ...this.state.emojiSettings,
                          emojis: filteredEmojis,
                          emojiMatchString: lastWord,
                          emojiIndex: 0,
                          emojiPickerActive : true
                      };
                      this.setState({
                          ...this.state,
                          emojiSettings: emojiSettings
                      });
                  }
                  else
                      this.hideEmojiPicker();
              } else
                  this.hideEmojiPicker();
          }
      }
  }

  onKeyDown(event) {
    this.autoComplete.onKeyDown(event, this.refs.message.value, UsersStore.users);

    // console.log("KEYDOWN", event.type, event.which);
    if(event.which === 9) {
      // Tab
      event.preventDefault();
      if (this.state.emojiSettings.emojiPickerActive) {
          const len = this.state.emojiSettings.emojis.length;
          const selectedIndex = (this.state.emojiSettings.emojiIndex + 1) % len;
          const emojiSettings = {
              ...this.state.emojiSettings,
              emojiIndex : selectedIndex
          };
          this.setState({
              ...this.state,
              emojiSettings : emojiSettings
          });
      }
      // TODO: autocomplete user names
    } else if(event.which === 186) {
      // ':'
      if (this.props.useEmojis) {
          const filteredEmojis = filterEmojis('', 50);
          const emojiSettings = {
              ...this.state.emojiSettings,
              emojis : filteredEmojis,
              emojiPickerActive : true
          };
         this.setState({
             ...this.state,
             emojiSettings : emojiSettings
         });
      }

  } else if (event.which === 13 || event.which === 32) {
      // Return or Space
      if (this.state.emojiSettings.emojiPickerActive) {
          event.preventDefault();
          this.displayEmojiText();
          this.hideEmojiPicker();
      }
  } else if (event.which === 27) {
      //ESC
      if (this.state.emojiSettings.emojiPickerActive) {
          this.hideEmojiPicker();
      }
  }
    return;
  }
  displayEmojiText () {
      let filteredEmojis = filterEmojis(this.state.emojiSettings.emojiMatchString.slice(1), 50);
      const emojiIndex = this.state.emojiSettings.emojiIndex;
      const emojiShortName = filteredEmojis[emojiIndex];
      let text = this.refs.message.value.split(" ");
      text.pop();
      text.push(emojiShortName);
      this.refs.message.value = text.join(" ");
  }

  render() {
    return (
      <div className="SendMessage">
        <form onSubmit={this.sendMessage.bind(this)}>
            {this.props.useEmojis &&
             this.state.emojiSettings.emojiPickerActive ? <EmojiPicker emojis={this.state.emojiSettings.emojis}
                                                         selected={this.state.emojiSettings.emojiIndex}/> : null}
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
