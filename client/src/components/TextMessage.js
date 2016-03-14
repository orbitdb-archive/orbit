'use strict';

import React from "react";
import TransitionGroup from "react-addons-css-transition-group";
import ReactEmoji from "react-emoji";
import ReactAutolink from "react-autolink";
import ReactIpfsLink from "components/plugins/react-ipfs-link";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import "styles/TextMessage.scss";

class TextMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.text,
      useEmojis: props.useEmojis,
      highlightWords: props.highlightWords
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      useEmojis: nextProps.useEmojis,
      highlightWords: nextProps.highlightWords
    });
  }

  componentDidMount() {
    // Remove the command from rendering
    if(this.state.text.startsWith("/me")) {
      const text = this.state.text.substring(3, this.state.text.length);
      this.setState({ text: text });
    }
  }

  // Higlight specified words (ie. username)
  _highlight(items) {
    return _.flatten(items.map((item) => {
      return (typeof item === 'string') ? MentionHighlighter.highlight(item, this.state.highlightWords, { highlightClassName: 'highlight', key: Math.random() }) : item;
    }));
  }

  // Create emojis
  _emojify(items) {
    const emojiOpts = {
      emojiType: 'emojione',
      attributes: { width: '16px', height: '16px' }
    };

    return _.flatten(items.map((item) => {
      emojiOpts.alt = item;
      emojiOpts.key = Math.random();
      return (typeof item === 'string' && this.state.useEmojis) ? ReactEmoji.emojify(item, emojiOpts) : item;
    }));
  }

  // Create linkss from IPFS hashes
  _ipfsfy(items) {
    return _.flatten(items.map((item) => {
      return (typeof item === 'string') ? ReactIpfsLink.linkify(item, { target: "_blank", rel: "nofollow", key: Math.random() }) : item;
    }));
  }

  render() {
    // Create links from urls
    let finalText = ReactAutolink.autolink(this.state.text, { target: "_blank", rel: "nofollow" });
    finalText = this._highlight(finalText);
    finalText = this._emojify(finalText);
    finalText = this._ipfsfy(finalText);

    const content = (
      <TransitionGroup transitionName="textAnimation" transitionAppear={true} className="content2">
        <span className="content2">{finalText}</span>
      </TransitionGroup>
    );

    return (<div className="TextMessage">{content}</div>);
  }
}

export default TextMessage;
