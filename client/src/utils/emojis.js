import ReactEmoji from "react-emoji";
import { emojiList } from "./emojilist"

module.exports.filterEmojis = function(match, n) {
    let re = new RegExp("::?("+ match +"){1}[\\w\\d_\\+-]*:$");
    const emojiOpts = {
      emojiType: 'emojione'
    };

    const filteredEmojis = _.filter(emojiList,emoji => re.test(emoji.shortname));
    const emojisWithImgs = filteredEmojis.map(emoji => {
                              const element = ReactEmoji.emojify(emoji.shortname, emojiOpts);
                              if (typeof element[0] !== 'string') //img not found, discard
                                  return {
                                      element : element,
                                      shortname: emoji.shortname
                                  };
                          });
    return _.take(emojisWithImgs, n)
            .filter(e => e != undefined);
}
