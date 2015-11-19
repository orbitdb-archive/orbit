import React  from 'react';
import assign from 'object-assign';

let ReactIpfsLink = () => {
  return {
    linkify(text, options = {}) {
      if (!text) return [];

      options.ipfsUrl = options.ipfsUrl || 'https://ipfs.io/ipfs/';

      return text.split(' ').map(word => {
        let match = word.length === 46 && word.startsWith('Qm');
        if (match) {
          let url = options.ipfsUrl + word;

          return React.createElement(
            'a',
            assign({href: url}, options),
            word
          );
        } else {
          return word;
        }
      });
    }
  };
};

export default ReactIpfsLink();
