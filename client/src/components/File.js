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

function readUTF8String(bytes) {
  let i = 0;
  let string = '';
  if (bytes.slice(0, 3) == '\xEF\xBB\xBF') {
    i = 3;
  }
  for (; i < bytes.byteLength; i++) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      string += String.fromCharCode(byte1);
    } else if (byte1 >= 0xc2 && byte1 < 0xe0) {
      const byte2 = bytes[++i];
      string += String.fromCharCode(((byte1 & 0x1f) << 6) + (byte2 & 0x3f));
    } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
      const byte2 = bytes[++i];
      const byte3 = bytes[++i];
      string += String.fromCharCode(((byte1 & 0xff) << 12) + ((byte2 & 0x3f) << 6) + (byte3 & 0x3f));
    } else if (byte1 >= 0xf0 && byte1 < 0xf5) {
      const byte2 = bytes[++i];
      const byte3 = bytes[++i];
      const byte4 = bytes[++i];
      const codepoint = (((byte1 & 0x07) << 18) + ((byte2 & 0x3f) << 12) + ((byte3 & 0x3f) << 6) + (byte4 & 0x3f)) - 0x10000;
      string += String.fromCharCode((codepoint >> 10) + 0xd800, (codepoint & 0x3ff) + 0xdc00);
    }
  }
  return string;
}

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
            } else {
              var fileReader = new FileReader();
              fileReader.onload = (event) => {
                const text = readUTF8String(new Uint8Array(event.target.result));
                if (this.isHighlightable) {
                  previewContent = <Highlight>{text}</Highlight>;
                } else {
                  previewContent = text;
                }
                this.setState({ previewContent });
              };
              fileReader.readAsArrayBuffer(blob);
              return;
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
