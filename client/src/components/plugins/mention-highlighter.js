import React  from 'react';
import assign from 'object-assign';

let MentionHighlighter = () => {
  return {
    highlight(srcText, highlightText, options = {}) {
      if (!srcText || !highlightText) return srcText;
      if(highlightText === '' || srcText === '') return srcText;

      return srcText.split(' ').map(word => {
        let match = word.startsWith(highlightText)
                || word.startsWith(highlightText + ":")
                || word.startsWith("@" + highlightText)
                || word.startsWith(highlightText + ",");
        if (match) {
          return React.createElement(
            'span',
            assign({className: options.highlightClassName}, options),
            word + " "
          );
        } else {
          return word + " ";
        }
      });
    }
  };
};

export default MentionHighlighter();
