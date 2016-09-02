'use strict';

import React, { PropTypes } from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import Dropzone from 'react-dropzone';
import Halogen from 'halogen';
import Spinner from 'components/Spinner';
import SendMessage from 'components/SendMessage';
import { getFormattedTime } from '../utils/utils.js';

class ChannelControls extends React.Component {

  static propTypes = {
      onSendMessage: PropTypes.func,
      onSendFiles: PropTypes.func,
      isLoading: PropTypes.bool,
      channelMode: PropTypes.string,
      appSettings: PropTypes.object,
      theme: PropTypes.object,
      replyto: PropTypes.object,
  };

  render() {
    const { onSendMessage, onSendFiles, isLoading, channelMode, appSettings, theme, replyto } = this.props;
    return (
      <TransitionGroup
        component="div"
        transitionName="controlsAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <div className="Controls" key="controls">
          <Spinner isLoading={isLoading} color="rgba(255, 255, 255, 0.7)" size="16px" />
          <span className="replyto">{replyto ? `Reply to:  "<${replyto.user.name}> ${replyto.post.content}"` : ""}</span>
          <SendMessage onSendMessage={onSendMessage} theme={theme} useEmojis={appSettings.useEmojis} replyto={replyto ? replyto.hash : null} />
          <Dropzone className="dropzone2" onDrop={onSendFiles}>
            <div className="icon flaticon-tool490" style={theme} />
          </Dropzone>
          <div className="statusMessage" style={theme}>{channelMode}</div>
        </div>
      </TransitionGroup>
    );
  }

}

export default ChannelControls;
