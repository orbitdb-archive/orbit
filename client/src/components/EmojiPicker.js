'use strict';

import React from 'react';
import ReactEmoji from "react-emoji";
import { filterEmojis } from "../utils/emojis";
import 'styles/EmojiPicker.scss';

const emojify = (emojis, highlightedIndex) => {
    const emojiOpts = {
      emojiType: 'emojione'
    };
    let counter = 0;
    return emojis.map(emoji => {
            let elementClass = '';
            const element = emoji.element;// ReactEmoji.emojify(emoji, emojiOpts)[0];
            if (counter === highlightedIndex)
                elementClass = 'selected';
            return (<li key={counter++}
                        className={elementClass}>
                        {element}
                    </li>);
        }
    );
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

    filterWord(lastWord){
        const emojiRe = /^::?[\w\d_\+-]*$/;
        if (emojiRe.test(lastWord)) {
            const filteredEmojis = filterEmojis(lastWord.slice(1), 50);
            if (filteredEmojis.length > 0)
            {
                this.setState({
                    ...this.state,
                    emojis: filteredEmojis
                });
            }
            else
                this.props.hideEmojiPicker();
        } else
            this.props.hideEmojiPicker();
    }

    selectHighlightedEmoji() {
        const filteredEmojis = this.state.emojis;
        const emojiIndex = this.state.highlightedIndex % filteredEmojis.length;
        const emojiShortName = filteredEmojis[emojiIndex].shortname;
        this.props.displayEmojiText(emojiShortName);
    }

    onKeyUp(event) {
        if(event.which === 9) {
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
        if(event.which === 9) {
            // Tab
            event.preventDefault();
            const newIndex = this.state.highlightedIndex + 1
            const highlightedIndex = newIndex % this.state.emojis.length;
            this.setState({
                ...this.state,
                highlightedIndex: highlightedIndex
            });
        }
        else if (event.which === 13 || event.which === 32) {
            // Return or Space
            event.preventDefault();
            this.selectHighlightedEmoji();
            this.props.hideEmojiPicker();
        } else if (event.which === 27) {
            //ESC
            this.props.hideEmojiPicker();
          }
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
