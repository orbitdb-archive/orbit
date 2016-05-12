'use strict';

import React from 'react';
import Actions from "actions/UIActions";
import 'styles/SendMessage.scss';
import UsersStore from 'stores/UsersStore';

class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.tabPressCounter = null;
    this.matches = []; 
    this.state = {
      theme: props.theme
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

  onKeyDown(event) {
    // console.log("KEYDOWN", event.type, event.which);
    if(event.which === 9) {
      // 'Tab': autocomplete user name
      event.preventDefault();

      if(this.tabPressCounter == null) {
        this.tabPressCounter = 0;
        this.words = this.refs.message.value.split(' ');
        let lastWord = this.words.pop().toLowerCase();
        let usersLc = UsersStore.users.map((f) => f.toLowerCase());
        this.matches = usersLc.map((f) => lastWord !== '' && f.startsWith(lastWord) ? f : null).filter((f) => f !== null)

      } else {
        this.tabPressCounter += 1;
        this.tabPressCounter = this.tabPressCounter % this.matches.length;
        this.words.pop();
      }

      if(this.matches.length > 0) {
        this.words.push(this.matches[this.tabPressCounter]);
        this.refs.message.value = this.words.join(' ');
      }
    } else if(event.which === 186) {
      // ':'
      // TODO: bring up emoji preview
    } else {
      this.words = this.refs.message.value.split(' ');
      this.tabPressCounter = null;
      this.matches = [];
    }
    return;
  }
  
  render() {
    return (
      <div className="SendMessage">
        <form onSubmit={this.sendMessage.bind(this)}>
          <input
            type="text"
            ref="message"
            placeholder="Type a message..."
            autoComplete={true}
            style={this.state.theme}
            onKeyDown={this.onKeyDown.bind(this)}
            />
        </form>
      </div>
    );
  }

}

export default SendMessage;
