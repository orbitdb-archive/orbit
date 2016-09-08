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
      onClearReplyTo: PropTypes.func,
  };

  render() {
    const { onSendMessage, onSendFiles, onClearReplyTo, isLoading, channelMode, appSettings, theme, replyto } = this.props;
    return (
      <TransitionGroup
        className={!this.props.embedded ? "ControlsContainer" : "ControlsContainerEmbedded"}
        component="div"
        transitionName="controlsAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <div className={this.props.disabled ? "Controls disabled" : "Controls"} key="controls">
          <SendMessage
            onSendMessage={onSendMessage}
            theme={theme}
            useEmojis={appSettings.useEmojis}
            replyto={replyto}
            onClearReplyTo={onClearReplyTo}
          />
          <Dropzone className="dropzone2" onDrop={onSendFiles} />
        </div>
      </TransitionGroup>
    );
  }

}

export default ChannelControls;
