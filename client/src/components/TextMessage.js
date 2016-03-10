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
      post: props.post,
      text: props.post.content,
      loading: false,
      useEmojis: props.userEmojis,
      highlight: props.highlight,
      isCommand: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ useEmojis: nextProps.useEmojis, highlight: nextProps.highlight });
  }

  componentDidMount() {
    this.ready = true;

    const onMessageReceived = (text) => {
      if(!this.ready)
        return;

      if(text) {
        // TODO: move to message, should be here
        if(text.startsWith('/me')) {
          this.setState({ isCommand: true });
          this.props.onHighlight(true);
        }

        text.split(" ").map((word) => {
          const highlight = MentionHighlighter.highlight(word, this.state.highlight);
          if(typeof highlight[0] !== 'string') this.props.onHighlight();
        });

        this.setState({ text: text, loading: false });
      }
    };
    onMessageReceived(this.state.text);
  }

  componentWillUnmount() {
    this.ready = false;
  }

  render() {
    const emojiOpts = {
      emojiType: 'emojione',
      attributes: { width: '16px', height: '16px' }
    };

    // Create links from urls
    const withLinks = ReactAutolink.autolink(this.state.text, { target: "_blank", rel: "nofollow" });

    // Higlight specified words (ie. username)
    const highlighted = _.flatten(withLinks.map(item => {
      if(typeof item === 'string') {
        const highlight = MentionHighlighter.highlight(item, this.state.highlight, { highlightClassName: 'highlight', key: Math.random() + 17 });
        return highlight;
      } else {
        return item;
      }
    }));

    // Create emojies
    const emojified = _.flatten(highlighted.map(item => {
      emojiOpts.alt = item;
      emojiOpts.key = Math.random();
      return (typeof item === 'string' && this.state.useEmojis) ? ReactEmoji.emojify(item, emojiOpts) : item;
    }));

    // Create links from IPFS hashes
    const finalText = _.flatten(emojified.map(item => {
      return (typeof item === 'string') ? ReactIpfsLink.linkify(item, { target: "_blank", rel: "nofollow", key: Math.random() + 19 }) : item;
    }));

    // Remove the command from rendering
    if(this.state.isCommand) finalText.splice(0, 1);

    const style   = this.state.loading ? "TextMessage loading" : "TextMessage";
    const content = this.state.loading ? this.state.text
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
