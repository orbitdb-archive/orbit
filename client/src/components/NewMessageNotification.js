'use strict';

import React, { PropTypes } from 'react';

class NewMessageNotification extends React.Component {

  static propTypes = {
      onClick: PropTypes.func,
      unreadMessages: PropTypes.number,
  };

  render() {
    const { onClick, unreadMessages } = this.props;
    if (unreadMessages > 0) {
      if (unreadMessages === 1) {
        return (
          <div className="newMessagesBar" onClick={onClick}>
            There is <span className="newMessagesNumber">1</span> new message
          </div>
        );
      } else {
        return (
          <div className="newMessagesBar" onClick={onClick}>
            There are <span className="newMessagesNumber">{unreadMessages}</span> new messages
          </div>
        );
      }
    }
    return null;
  }

}

export default NewMessageNotification;
