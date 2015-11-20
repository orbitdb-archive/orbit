'use strict';

import React         from "react";
import TransitionGroup from "react-addons-css-transition-group";
import ReactEmoji    from "react-emoji";
import ReactAutolink from "react-autolink";
import ReactIpfsLink from "components/plugins/react-ipfs-link";
import MentionHighlighter from 'components/plugins/mention-highlighter';
import ChannelActions from "actions/ChannelActions"; // TODO: move to MessageActions?
import "styles/TextMessage.scss";

class TextMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      text: "...",
      loading: true,
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

    var onMessageReceived = message => {
      if(!this.ready) return;
      if(message) {
        message.content.split(" ").map((word) => {
          var highlight = MentionHighlighter.highlight(word, this.state.highlight);
          if(typeof highlight[0] !== 'string') this.props.onHighlight();

          var command = MentionHighlighter.highlight(word, ['/me']);
          if(typeof command[0] !== 'string') {
            this.setState({ isCommand: true });
            this.props.onHighlight(true);
          }
        });

        this.setState({ text: message.content, loading: false });
      }
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

    // Create links from urls
    var withLinks = ReactAutolink.autolink(this.state.text, { target: "_blank", rel: "nofollow" });

    // Higlight specified words (ie. username)
    var highlighted = _.flatten(withLinks.map(item => {
      if(typeof item === 'string') {
        var highlight = MentionHighlighter.highlight(item, this.state.highlight, { highlightClassName: 'highlight', key: Math.random() + 17 });
        return highlight;
      } else {
        return item;
      }
    }));

    // Create emojies
    var emojified = _.flatten(highlighted.map(item => {
      emojiOpts.alt = item;
      emojiOpts.key = Math.random();
      return (typeof item === 'string' && this.state.useEmojis) ? ReactEmoji.emojify(item, emojiOpts) : item;
    }));

    // Create links from IPFS hashes
    var finalText = _.flatten(emojified.map(item => {
      return (typeof item === 'string') ? ReactIpfsLink.linkify(item, { target: "_blank", rel: "nofollow", key: Math.random() + 19 }) : item;
    }));

    // Remove the command from rendering
    if(this.state.isCommand) finalText.splice(0, 1);

    var style   = this.state.loading ? "TextMessage loading" : "TextMessage";
    var content = this.state.loading ? this.state.text
                                     // : <span className="content2">{finalText}</span>;
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
