'use strict';

import _ from 'lodash';
import React from 'react';
import ReactEmoji from "react-emoji";
import { emojiData } from "../utils/emojilist";
import emojisAnnotations from 'emoji-annotation-to-unicode';
import 'styles/EmojiPicker.scss';

const modulo = (op1, op2) => (((op1 % op2) + op2) % op2);
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
            highlightedIndex: 0,
            keysDown: {}
        }
    }

    selectEmoji(index) {
        const emojiShortName = this.state.emojis[index] ? this.state.emojis[index].shortname : this.props.filterText;
        this.props.onSelectEmoji(emojiShortName);
    }

    onKeyUp(event) {
        if (event.which === 16) {
            // Shift
            const keysDown = { 'shift' : false };
            this.setState({ keysDown: keysDown });
        }
    }
    onKeyDown(event) {
        if (event.which === 8) {
            // Backspace
            this.selectEmoji(-1);
            if(this.state.highlightedIndex !== 0) {
                event.preventDefault();
                this.setState({ highlightedIndex: 0});
            }
        } else if (event.which === 16) {
            // Shift
            const keysDown = { 'shift' : true };
            this.setState({ keysDown: keysDown });
        } else if(event.which === 9) {
            // Tab
            event.preventDefault();
            if (this.state.keysDown['shift']) {
                // Shift + Tab
                this.cycle(-1);
            } else {
                this.cycle(1);
            }
        } else if (event.which === 39) {
            // Right arrow
            event.preventDefault();
            this.cycle(1);
        } else if (event.which === 37) {
            // Left arrow
            event.preventDefault();
            this.cycle(-1);
        } else if (event.which === 38) {
            // Up arrow
            event.preventDefault();
            this.cycleRow(-8);
        } else if (event.which === 40) {
            // Down arrow
            event.preventDefault();
            this.cycleRow(8);
        } else if (event.which === 13 || event.which === 32) {
            // Return or Space
            event.preventDefault();
            this.selectEmoji(this.state.highlightedIndex);
            this.props.onClose();
        } else if (event.which === 27) {
            //ESC
            this.selectEmoji(-1);
            this.props.onClose();
          }
      }

      cycleRow(step) {
          const newIndex = this.state.highlightedIndex + step;
          const elemsPerRow = 8;
          const offset = modulo(newIndex, elemsPerRow);
          const count = this.state.emojis.length;
          const numRows = Math.ceil(count/elemsPerRow);
          const maxRow = numRows*elemsPerRow - (elemsPerRow - offset) < count ? numRows : numRows - 1;
          const row = modulo(Math.floor(newIndex / elemsPerRow), maxRow);
          const highlightedIndex = row*elemsPerRow + offset;
          this.setState({ highlightedIndex: highlightedIndex });
          this.selectEmoji(highlightedIndex);
      }

      cycle(step) {
          const newIndex = this.state.highlightedIndex + step;
          const count = this.state.emojis.length;
          const highlightedIndex = modulo(newIndex, count);
          this.setState({ highlightedIndex: highlightedIndex });
          this.selectEmoji(highlightedIndex);
      }

      componentWillReceiveProps(nextProps) {
          const emojis = filterEmojis(emojiList, nextProps.filterText, 100);
          this.setState({ emojis: emojis });
          if(nextProps.filterText === '' || emojis.length === 0)
              this.props.onClose();
      }

      componentDidMount() {
          const emojis = filterEmojis(emojiList, this.props.filterText, 100);
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
