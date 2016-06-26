'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import Clipboard from 'clipboard';
import highlight from 'highlight.js'
import Highlight from 'components/plugins/highlight';
import { getHumanReadableBytes } from '../utils/utils.js';
import ChannelActions from 'actions/ChannelActions';
import MessageStore from 'stores/MessageStore';
import 'styles/File.scss';

import Logger from 'logplease';
const logger = Logger.create('Clipboard', { color: Logger.Colors.Magenta });

class File extends React.Component {

  constructor(props) {
    super(props);
    this.ext = /(?:\.([^.]+))?$/.exec(props.name)[1];
    this.state = {
      showPreview: false,
      previewContent: "Loading...",
    };
    this.clipboard = new Clipboard('.clipboard-' + props.hash, {
      text: function(trigger) {
        logger.info(props.hash + " copied to clipboard!");
        return props.hash;
      }
    });
  }

  get isVideo() {
    return this.ext === 'mp4' || this.ext === 'webm' || this.ext === 'ogv';
  }

  get isAudio() {
    return this.ext === 'mp3' || this.ext === 'ogg';
  }

  get isImage() {
    return this.ext === 'png' || this.ext === 'jpg' || this.ext === 'gif';
  }

  get isHighlightable() {
    return highlight.getLanguage(this.ext);
  }

  handleClick(name) {
    this.setState({
      showPreview: !this.state.showPreview,
      previewContent: 'Loading...',
    }, () => {
      if (this.state.showPreview) {
        ChannelActions.loadFile(this.props.hash, blob => {
          let previewContent = 'Unable to display file.';
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            if (this.isAudio) {
              previewContent = <audio height={200} src={url} controls autoPlay={true} />;
            } else if (this.isImage) {
              previewContent = <img height={200} src={url} />;
            } else if (this.isVideo) {
              previewContent = <video height={200} src={url} controls autoPlay={false} />;;
            // } else if (this.isHighlightable) {
            //   previewContent = <Highlight>{blob}</Highlight>;
            // } else {
            }
          }
          this.setState({ previewContent });
        });
      }
    });
  }

  render() {
    const size = getHumanReadableBytes(this.props.size);
    const className = `clipboard-${this.props.hash} download`;
    const preview = (
      <div className="preview smallText">
        {this.state.previewContent}
      </div>
    );
    return (
      <div className="File" key={this.props.hash}>
        <TransitionGroup
          transitionName="fileAnimation"
          transitionEnter={true}
          transitionLeave={true}
          transitionAppearTimeout={0}
          transitionEnterTimeout={2000}
          transitionLeaveTimeout={1000}
          component="div"
          className="content">
            <span className="text" onClick={this.handleClick.bind(this)}>{this.props.name}</span>
            {/*
            <a className="download" href={openLink} target="_blank">Open</a>
            <a className="download" href={downloadLink}>Download</a>
            */}
            <span className={className}>Hash</span>
            <span className="size">{size}</span>
            {this.state.showPreview && preview}
        </TransitionGroup>
      </div>
    );
  }

}

export default File;
