'use strict';

import React from 'react';
import ReactEmoji from "react-emoji";
import { emojiData } from "../utils/emojilist";
import emojisAnnotations from 'emoji-annotation-to-unicode';
import 'styles/EmojiPicker.scss';

const supportedEmojis = Object.values(emojisAnnotations).filter((e) => e !== '1f642');
const emojiList = _.pickBy(emojiData, (e) => supportedEmojis.indexOf(e.unicode) > -1);

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

    selectHighlightedEmoji() {
        const filteredEmojis = this.state.emojis;
        const emojiIndex = this.state.highlightedIndex % filteredEmojis.length;
        const emojiShortName = filteredEmojis[emojiIndex].shortname;
        this.props.displayEmojiText(emojiShortName);
    }

    onKeyUp(event) {
        if(event.which === 9 || event.which === 37 || event.which === 39) {
               //Tab or left or right arrow
            this.selectHighlightedEmoji();
        }
    }
    onKeyDown(event) {
        if (event.which === 8) {
            this.setState({
                ...this.state,
                highlightedIndex: 0
            });
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
            this.selectHighlightedEmoji();
            this.props.onClose();
        } else if (event.which === 27) {
            //ESC
            this.props.onClose();
          }
      }

      cycleRight() {
          const newIndex = this.state.highlightedIndex + 1;
          const highlightedIndex = newIndex % this.state.emojis.length;
          this.setState({
              ...this.state,
              highlightedIndex: highlightedIndex
          });
      }
      cycleLeft() {
          console.log(-1 % 5);
          let newIndex = this.state.highlightedIndex - 1;
          const n = this.state.emojis.length;
          const highlightedIndex = ((newIndex % n)+n)%n;
          this.setState({
              ...this.state,
              highlightedIndex: highlightedIndex
          });
      }

      componentWillReceiveProps(nextProps) {
          const emojis = filterEmojis(emojiList, nextProps.filterText, 100);
          this.setState({ emojis: emojis });
          if(nextProps.filterText === '' || emojis.length === 0)
              this.props.onClose();
      }

      componentDidMount() {
          const emojis = filterEmojis(emojiList, this.props.filterText, 50);
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
