'use strict';

import pickBy from 'lodash.pickby';
import React from 'react';
import ReactEmoji from "react-emoji";
import { emojiData } from "../utils/emojilist";
import emojisAnnotations from 'emoji-annotation-to-unicode';
import 'styles/EmojiPicker.scss';

const modulo = (op1, op2) => (((op1 % op2) + op2) % op2);

const supportedEmojiUnicodes = Object.keys(emojisAnnotations)
  .map((e) => emojisAnnotations[e])
  .filter((e) => e !== '1f306');

const supportedEmojis = Object.keys(emojiData)
  .map((e) => emojiData[e])
  .filter((e) => supportedEmojiUnicodes.indexOf(e.unicode) > -1);

const emojiList = supportedEmojis.map((e) => {
  if (e.shortname.startsWith(':flag_'))
    e.shortname = e.shortname.replace('flag_', '');
  else if (e.shortname === ':ten:')
    e.shortname = e.shortname.replace('ten', 'keycap_ten');
  else if (e.shortname.startsWith(':slight_'))
    e.shortname = e.shortname.replace('slight', 'simple');
  return e;
});

const filterEmojis = function(emojiList, word, amount) {
  return Object.keys(emojiList)
  .map((e) => emojiList[e])
  .filter((e) => e.shortname.indexOf(word) > -1 || e.aliases.indexOf(word) > -1 || word === '')
  .slice(0, amount);
};

const emojify = (emojis, highlightedIndex, onMouseEnter, onClick) => {
  const emojiOpts = { emojiType: 'emojione' };
  return emojis
  .map(e => ReactEmoji.emojify(e.shortname, emojiOpts))
  .map((e, index) => {
    return <li key={index}
      onMouseEnter={ (e) => { e.preventDefault(); onMouseEnter(index); }}
      onClick={ (e) => { e.preventDefault(); onClick(index); }}
      className={index === highlightedIndex ? 'selected' : ''}>{e}</li>
  });
};

const EmojiList = ({
  emojis,
  highlightedIndex,
  onMouseEnter,
  onClick
}) => <ul> { emojify(emojis, highlightedIndex, onMouseEnter, onClick) } </ul>

class EmojiPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emojis: [],
      highlightedIndex: 0,
    }
  }

  selectEmoji(index) {
    const emojiShortName = this.state.emojis[index] ? this.state.emojis[index].shortname : this.props.filterText;
    this.props.onSelectEmoji(emojiShortName);
  }

  onKeyDown(event) {
    if (event.which === 8) {
      // Backspace
      this.selectEmoji(-1);
      if(this.state.highlightedIndex !== 0) {
        event.preventDefault();
        this.setState({ highlightedIndex: 0});
      }
    } else if(event.which === 9) {
      // Tab
      event.preventDefault();
      if (event.shiftKey)
        // Shift + Tab
        this.cycle(-1);
      else
        this.cycle(1);
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
      this.cycleRow(-this.props.elemsPerRow);
    } else if (event.which === 40) {
      // Down arrow
      event.preventDefault();
      this.cycleRow(this.props.elemsPerRow);
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

  onClick(index) {
    this.props.onClose();
  }

  onMouseEnter(index) {
    this.setState({ highlightedIndex: index});
    this.selectEmoji(index);
  }

  cycleRow(step) {
    const newIndex = this.state.highlightedIndex + step;
    const elemsPerRow = this.props.elemsPerRow;
    const offset = modulo(newIndex, elemsPerRow);
    const count = this.state.emojis.length;
    const numRows = Math.ceil(count / elemsPerRow);
    const maxRow = numRows * elemsPerRow - (elemsPerRow - offset) < count ? numRows : numRows - 1;
    const row = modulo(Math.floor(newIndex / elemsPerRow), maxRow);
    const highlightedIndex = row * elemsPerRow + offset;
    this.setState({ highlightedIndex: highlightedIndex });
    this.selectEmoji(highlightedIndex);
  }

  cycle(step) {
    const highlightedIndex = modulo(this.state.highlightedIndex + step, this.state.emojis.length);
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
      <div className="emoji-picker" style={{ width:this.props.elemsPerRow * 28 + 12 }}>
        <EmojiList
          emojis={this.state.emojis}
          highlightedIndex={this.state.highlightedIndex}
          onMouseEnter={this.onMouseEnter.bind(this)}
          onClick={this.onClick.bind(this)}/>
      </div>
    );
  }
}

export default EmojiPicker;
