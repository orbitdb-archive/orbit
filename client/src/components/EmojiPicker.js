import React from 'react';
import ReactEmoji from "react-emoji";
import 'styles/EmojiPicker.scss';

const emojify = (emojis, selected) => {
    const emojiOpts = {
      emojiType: 'emojione'
    };
    let counter = 0;
    return emojis.map(emoji => {
            let elementClass = '';
            const element = ReactEmoji.emojify(emoji, emojiOpts)[0];
            if (typeof element !== 'string'){ //shortname string returned if no emoji_img found, discard
                if (counter === selected)
                    elementClass = 'selected';
                return (<li key={counter++}
                            className={elementClass}>
                            {element}
                        </li>);
            }
        }
    );
};

const EmojiList = ({
    emojis,
    selected
}) => <ul>{emojify(emojis, selected)}</ul>

const EmojiPicker = ({
    selected,
    emojis
}) => <div className="emoji-picker">
        <EmojiList emojis={emojis} selected={selected}/>
     </div>

export default EmojiPicker;
