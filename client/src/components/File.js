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
      showPreview: true,
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

  componentDidMount() {
    this.loadPreview()
  }

  loadPreview() {
    function toArrayBuffer(buffer) {
      var ab = new ArrayBuffer(buffer.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
          view[i] = buffer[i];
      }
      return ab;
    }

    if (this.state.showPreview) {
      const isMedia = this.isAudio | this.isVideo | this.isImage
      const asURL = isElectron & isMedia === 1
      const asStream = this.isVideo
      let blob = new Blob([])

      ChannelActions.loadFile(this.props.hash, asURL, asStream, (err, buffer, url, stream) => {
        if (err) {
          console.error(err)
          return
        }

        let previewContent = 'Unable to display file.'
        if (buffer || url || stream) {

          if(buffer) {
            const arrayBufferView = toArrayBuffer(buffer)
            blob = new Blob([arrayBufferView], { type: this.state.meta.mimeType })
            // blob = buffer
          } else if (buffer && this.state.meta.mimeType) {
            const arrayBufferView = toArrayBuffer(buffer)
            blob = new Blob([arrayBufferView], { type: this.state.meta.mimeType })
          }

          if(buffer)
            url = window.URL.createObjectURL(blob)

          if (this.isAudio) {
            previewContent = <audio src={url} controls autoPlay={false} />
          } else if (this.isImage) {
            previewContent = <img src={url} />
          } else if (this.isVideo) {
            if (isElectron) {
              previewContent = <video src={url} controls autoPlay={false} />
              this.setState({ previewContent })
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
              this.setState({ previewContent })
            }
            fileReader.readAsText(blob, 'utf-8')
            return
          }
        }
        this.setState({ previewContent })
      })
    }
  }

  // handleClick(evt) {
  //   evt.stopPropagation()
  // }

  render() {
    var openLink = (isElectron ? "http://localhost:8080/ipfs/" : "https://ipfs.io/ipfs/") + this.props.hash;
    const size = getHumanReadableBytes(this.props.size);
    const className = `clipboard-${this.props.hash} download`;
    const preview = (
      <div className="preview smallText">
        <a href={openLink} target="_blank">
          {this.state.previewContent}
        </a>
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
            <div className="text">{this.props.name}</div>
            {this.state.showPreview && preview}
            <a className="download" href={openLink} download={this.props.name}>Download</a>
            <span className="spacer">  |  </span>
            <span className={className}>Copy Hash</span>
        </TransitionGroup>
      </div>
    );
  }

}

export default File;
