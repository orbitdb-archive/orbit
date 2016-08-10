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
    return this.ext === 'png' || this.ext === 'jpg' || this.ext === 'gif' || this.ext === 'svg';
  }

  get isHighlightable() {
    return highlight.getLanguage(this.ext);
  }

  handleClick(name) {
    this.setState({
      showPreview: !this.state.showPreview,
      previewContent: 'Loading...',
    }, () => {
      const hasIPFS = !!window.ipfs;
      if (this.state.showPreview) {

        ChannelActions.loadFile(this.props.hash, this.isAudio | this.isVideo | this.isImage, this.isVideo && !hasIPFS, (err, blob, url, stream) => {
          if (err) {
            console.error(err)
            return
          }

          let previewContent = 'Unable to display file.'
          if (blob || url || stream) {
            if (!url && !stream) url = window.URL.createObjectURL(blob)
            if (this.isAudio) {
              previewContent = <audio height={200} src={url} controls autoPlay={true} />
            } else if (this.isImage) {
              previewContent = <img height={200} src={url} />
            } else if (this.isVideo) {
              if (hasIPFS) {
                previewContent = <video height={200} src={url} ref="videoPlayer" controls autoPlay={true} />
                return
              } else {
                function toArrayBuffer(buffer) {
                  var ab = new ArrayBuffer(buffer.length);
                  var view = new Uint8Array(ab);
                  for (var i = 0; i < buffer.length; ++i) {
                      view[i] = buffer[i];
                  }
                  return ab;
                }

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
    })
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
          transitionLeave={false}
          transitionAppearTimeout={0}
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={0}
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
