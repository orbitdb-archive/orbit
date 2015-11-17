'use strict';

import React         from "react/addons";
import ChannelActions       from "actions/ChannelActions";
import ReactEmoji    from "react-emoji";
import ReactAutolink from "react-autolink";

import "styles/TextMessage.scss";

const TransitionGroup = React.addons.CSSTransitionGroup;

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
    var finalText = withLinks.map(item => {
      return (typeof item === 'string' && this.state.useEmojis) ? ReactEmoji.emojify(item, emojiOpts) : item;
    });

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
