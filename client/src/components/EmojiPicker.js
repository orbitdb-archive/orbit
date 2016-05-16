'use strict';

import React from 'react';
import ReactEmoji from "react-emoji";
import { emojiData } from "../utils/emojilist";
import emojisAnnotations from 'emoji-annotation-to-unicode';
import 'styles/EmojiPicker.scss';

const supportedEmojis = Object.values(emojisAnnotations).filter((e) => e !== '1f642');
const emojiList = _.pickBy(emojiData, (e) => supportedEmojis.indexOf(e.unicode) > -1);
const maxEmojiAmount = 100;
const filterEmojis = function(emojiList, word, amount) {
  return Object.values(emojiList)
    .filter((e) => e.shortname.indexOf(word) > -1 || e.aliases.indexOf(word) > -1 || word === '')
    .slice(0, amount);
};

const emojify = (emojis, highlightedIndex) => {
  const emojiOpts = { emojiType: 'emojione' };
  return emojis
    .map(e => ReactEmoji.emojify(e.shortname, emojiOpts))
    .map((e, index) => <li key={index} className={index === highlightedIndex ? 'selected' : ''}>{e}</li>);
};

const EmojiList = ({
    emojis,
    highlightedIndex
}) => <ul> { emojify(emojis, highlightedIndex) } </ul>

class EmojiPicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            emojis: [],
            highlightedIndex: 0
        }
    }

    selectEmoji(index) {
        const emojiShortName = this.state.emojis[index] ? this.state.emojis[index].shortname : this.props.filterText;
        this.props.onSelectEmoji(emojiShortName);
    }

    onKeyDown(event) {
        if (event.which === 8) {
            // Backspace
            this.setState({ highlightedIndex: 0 });
        }
        if(event.which === 9 || event.which === 39) {
            // Tab or Right
            event.preventDefault();
            this.cycleRight();
        } else if (event.which === 37) {
            // Left
            event.preventDefault();
            this.cycleLeft();
        } else if (event.which === 13 || event.which === 32) {
            // Return or Space
            event.preventDefault();
            this.selectEmoji(this.state.highlightedIndex);
            this.props.onClose();
        } else if (event.which === 27) {
            //ESC
            this.props.onClose();
          }
      }

      cycleRight() {
          const newIndex = this.state.highlightedIndex + 1;
          const highlightedIndex = newIndex % this.state.emojis.length;
          this.setState({ highlightedIndex: highlightedIndex });
          this.selectEmoji(highlightedIndex);
      }

      cycleLeft() {
          let newIndex = this.state.highlightedIndex - 1;
          const count = this.state.emojis.length;
          const highlightedIndex = ((newIndex % count) + count) % count;
          this.setState({ highlightedIndex: highlightedIndex });
          this.selectEmoji(highlightedIndex);
      }

      componentWillReceiveProps(nextProps) {
          const emojis = filterEmojis(emojiList, nextProps.filterText, maxEmojiAmount);
          this.setState({ emojis: emojis });
          if(nextProps.filterText === '' || emojis.length === 0)
              this.props.onClose();
      }

      componentDidMount() {
          const emojis = filterEmojis(emojiList, this.props.filterText, maxEmojiAmount);
          this.setState({emojis: emojis});
          if(emojis.length === 0)
              this.props.onClose();
      }

      render() {
          return (
              <div className="emoji-picker">
                  <EmojiList
                      emojis={this.state.emojis}
                      highlightedIndex={this.state.highlightedIndex}/>
              </div>
          );
      }
  }

export default EmojiPicker;
