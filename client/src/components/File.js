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

const isElectron = !!window.ipfsInstance;

class File extends React.Component {
  constructor(props) {
    super(props);
    this.ext = /(?:\.([^.]+))?$/.exec(props.name)[1];
    this.state = {
      meta: props.meta,
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
    return this.ext === 'mp4' || this.ext === 'webm' || this.ext === 'ogv' || this.ext === 'avi' || this.ext === 'mkv';
  }

  get isAudio() {
    return this.ext === 'mp3' || this.ext === 'ogg' || this.ext === 'wav';
  }

  get isImage() {
    return this.ext === 'png' || this.ext === 'jpg' || this.ext === 'gif' || this.ext === 'svg' || this.ext === 'bmp';
  }

  get isHighlightable() {
    return highlight.getLanguage(this.ext);
  }

  handleClick(evt) {
    evt.stopPropagation()

    function toArrayBuffer(buffer) {
      var ab = new ArrayBuffer(buffer.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
          view[i] = buffer[i];
      }
      return ab;
    }

    this.setState({
      showPreview: !this.state.showPreview,
      previewContent: 'Loading...',
    }, () => {
      if (this.state.showPreview) {

        const isMedia = this.isAudio | this.isVideo | this.isImage
        const asURL = isElectron & isMedia
        const asStream = this.isVideo
        let blob = new Blob([])

        ChannelActions.loadFile(this.props.hash, asURL, asStream, (err, buffer, url, stream) => {
          if (err) {
            console.error(err)
            return
          }

          let previewContent = 'Unable to display file.'
          if (buffer || url || stream) {

            if(buffer && isElectron) {
              blob = buffer
            } else if (buffer && this.state.meta.mimeType) {
              const arrayBufferView = toArrayBuffer(buffer)
              blob = new Blob([arrayBufferView], { type: this.state.meta.mimeType })
            }

            if(buffer)
              url = window.URL.createObjectURL(blob)
            // if (buffer && this.state.meta.mimeType && isMedia) {
            //   const arrayBufferView = toArrayBuffer(buffer)
            //   blob = new Blob([arrayBufferView], { type: this.state.meta.mimeType })
            // } else if (isElectron) {
            //   blob = buffer
            //   url = window.URL.createObjectURL(blob)
            // }

            if (this.isAudio) {
              previewContent = <audio height={200} src={url} controls autoPlay={true} />
            } else if (this.isImage) {
              previewContent = <img height={200} src={url} />
            } else if (this.isVideo) {
              if (isElectron) {
                previewContent = <video height={200} src={url} controls autoPlay={true} />
                this.setState({ previewContent }, () => this.props.onPreviewOpened(this.refs.preview))
                return
              } else {
                const mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
                const source = new MediaSource()
                url = window.URL.createObjectURL(source)

                source.addEventListener('sourceopen', (e) => {
                  let sourceBuffer = source.addSourceBuffer(mimeCodec)
                  let buf = []

                  sourceBuffer.addEventListener('updateend', () => {
                    if(buf.length > 0)
                      sourceBuffer.appendBuffer(buf.shift())
                  })

                  stream.on('data', (data) => {
                    if(!sourceBuffer.updating)
                      sourceBuffer.appendBuffer(toArrayBuffer(data));
                    else
                      buf.push(toArrayBuffer(data));
                  });
                  stream.on('end', () => {
                    setTimeout(() => {
                      if(source.readyState === 'open')
                        source.endOfStream()
                      // this.refs.videoPlayer.play();
                    }, 100);
                  });
                  stream.on('error', (e) => console.error(e))
                })

                previewContent = <video height={200} src={url} controls autoPlay={false} />
              }
            } else {
              var fileReader = new FileReader()
              fileReader.onload = (event) => {
                previewContent = this.isHighlightable ? <Highlight>{event.target.result}</Highlight> : <pre>{event.target.result}</pre>
                this.setState({ previewContent }, () => this.props.onPreviewOpened(this.refs.preview))
              }
              fileReader.readAsText(blob, 'utf-8')
              return
            }
          }
          this.setState({ previewContent }, () => this.props.onPreviewOpened(this.refs.preview))
        })
      }
    })
  }

  render() {
    const gateway = isElectron ? 'http://' + window.gatewayAdddress : 'https://ipfs.io./ipfs/'
    const openLink = gateway + this.props.hash;
    const size = getHumanReadableBytes(this.props.size);
    const className = `clipboard-${this.props.hash} download`;
    const preview = (
      <div className="preview smallText" ref="preview">
        {this.state.previewContent}
      </div>
    );
    return (
      <div className="File" key={this.props.hash}>
        <TransitionGroup
          transitionName="fileAnimation"
          transitionEnter={true}
          transitionLeave={false}
          transitionAppearTimeout={0}
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={0}
          component="div"
          className="content">
            <span className="text" onClick={this.handleClick.bind(this)}>{this.props.name}</span>
            <a className="download" href={openLink} target="_blank">Open</a>
            <a className="download" href={openLink} download={this.props.name}>Download</a>
            <span className={className}>Hash</span>
            <span className="size">{size}</span>
            {this.state.showPreview && preview}
        </TransitionGroup>
      </div>
    );
  }

}

export default File;
