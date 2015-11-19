'use strict';

import React         from "react";
import TransitionGroup from "react-addons-css-transition-group";
import ReactEmoji    from "react-emoji";
import ReactAutolink from "react-autolink";
import ReactIpfsLink from "components/plugins/react-ipfs-link";
import ChannelActions from "actions/ChannelActions"; // TODO: move to MessageActions?
import "styles/TextMessage.scss";

class TextMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      text: "...",
      loading: true,
      useEmojis: props.userEmojis
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ useEmojis: nextProps.useEmojis });
  }

  componentDidMount() {
    this.ready = true;
    var onMessageReceived = message => {
      if(!this.ready) return;
      if(message)
        this.setState({ text: message.content, loading: false });
      else
        setTimeout(() => { ChannelActions.loadMessageContent(this.state.message.hash, onMessageReceived); }, 200);
    };
    ChannelActions.loadMessageContent(this.state.message.hash, onMessageReceived);
  }

  componentWillUnmount() {
    this.ready = false;
  }

  render() {
    var emojiOpts = {
      emojiType: 'emojione',
      attributes: { width: '16px', height: '16px' }
    };

    var withLinks = ReactAutolink.autolink(this.state.text, { target: "_blank", rel: "nofollow" });
    var emojified = _.flatten(withLinks.map(item => {
      return (typeof item === 'string' && this.state.useEmojis) ? ReactEmoji.emojify(item, emojiOpts) : item;
    }));
    console.log(emojified);
    var finalText = _.flatten(emojified.map(item => {
      return (typeof item === 'string') ? ReactIpfsLink.linkify(item, { ipfsUrl: 'http://localhost:5001/api/v0/cat/', target: "_blank", rel: "nofollow" }) : item;
    }));

    var style   = this.state.loading ? "TextMessage loading" : "TextMessage";
    var content = this.state.loading ? this.state.text
                                     : <TransitionGroup transitionName="textAnimation" transitionAppear={true} className="content2">
                                         <span className="content2">{finalText}</span>
                                       </TransitionGroup>;

    return (
      <div className={style}>
        {content}
      </div>
    );
  }
}

export default TextMessage;
