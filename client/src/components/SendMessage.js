'use strict';

import React from 'react';
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
    this.autoComplete.onKeyDown(event, this.refs.message.value, UsersStore.users);
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
