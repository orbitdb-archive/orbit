'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import { getHumanReadableBytes } from '../utils/utils.js';
import apiurl from 'utils/apiurl';
import 'styles/File.scss';
import Highlight from 'components/plugins/highlight';
import highlight from 'highlight.js'
import ChannelActions from 'actions/ChannelActions';
import Clipboard from 'clipboard';

import MessageStore from 'stores/MessageStore';


import Logger from 'logplease';
const logger = Logger.create('Clipboard', { color: Logger.Colors.Magenta });

var getFileUrl = apiurl.getApiUrl() + "/api/cat/";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      file: props.hash,
      size: props.size,
      showPreview: false,
      previewContent: "Loading...",
    };
    var self = this;
    this.clipboard = new Clipboard('.clipboard-' + this.state.file, {
      text: function(trigger) {
        logger.info(self.state.file + " copied to clipboard!");
        return self.state.file;
      }
    });
  }

  handleClick(name) {
    const isCode = this._isTextFile(this.state.name);

    if(!this.state.showPreview && isCode) {
      ChannelActions.loadFile(this.state.file, (err, contents) => {
        this.setState({ previewContent: <Highlight>{contents}</Highlight> });
      });
    } else {
      this.setState({ previewContent: "Loading..." });
    }

    function toArrayBuffer(buffer) {
      var ab = new ArrayBuffer(buffer.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
          view[i] = buffer[i];
      }
      return ab;
    }

    if(!this.state.showPreview) {
      setTimeout(() => {
        var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        let source = new MediaSource();
        this.refs.video_tag.src = window.URL.createObjectURL(source);

        source.addEventListener('sourceopen', (e) => {
          let sourceBuffer = source.addSourceBuffer(mimeCodec);
          MessageStore.orbit.ipfs.files.cat(this.state.file, (err, res) => {
            let buf = [];
            sourceBuffer.addEventListener('updateend', () => {
              if(buf.length > 0)
                sourceBuffer.appendBuffer(buf.shift())
            });
            res
              .on('error', (err) => console.error(err))
              .on('data', (data) => {
                if(!sourceBuffer.updating)
                  sourceBuffer.appendBuffer(toArrayBuffer(data));
                else
                  buf.push(toArrayBuffer(data));
              })
              .on('end', () => {
                console.log("END!!!")
                setTimeout(() => {
                  source.endOfStream()
                  this.refs.video_tag.play();
                }, 100);
              })
          });
        }, false);
      }, 500);
    }

    this.setState({ showPreview: !this.state.showPreview });
  }

  _isTextFile(name) {
    return highlight.getLanguage(this.state.name.split('.').pop());
  }

  render() {
    var openLink     = "http://localhost:8080/ipfs/" + this.state.file;
    var downloadLink = getFileUrl + this.state.file + "?name=" + this.state.name + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);

    var split = this.state.name.split('.');
    var isVideo = split[split.length - 1] === 'mp4' || split[split.length - 1] === 'webm';
    var isAudio = split[split.length - 1] === 'mp3';
    var isCode  = this._isTextFile(this.state.name);
    var isPicture = split[split.length - 1] === 'png';

    var video;
    var audio;
    var code;
    var picture;

    if(isVideo)
      video = this.state.showPreview ? <div className="preview"><video height={200} ref="video_tag" src={openLink} controls autoPlay={false}/></div> : <span/>;
    if(isAudio)
      audio = this.state.showPreview ? <div className="preview"><audio height={200} ref="audio_tag" src={openLink} controls autoPlay={true}/></div> : <span/>;
    if(isCode)
      code = this.state.showPreview ? <div className="preview smallText" style={this.state.theme}>{this.state.previewContent}</div> : <span/>;
    if(isPicture)
      picture = this.state.showPreview ? <div className="preview"><a href={openLink} target="_blank"><img height={200} src={openLink}/></a></div> : <span/>;

    const className = "clipboard-" + this.state.file + " download";

    var content = <span/>
    if(isVideo) {
      content =
        (<TransitionGroup
          transitionName="fileAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="content"
          >
          <span className="text" onClick={this.handleClick.bind(this, this.state.name)}>{this.state.name}</span>
          <a className="download" href={openLink} target="_blank">Open</a>
          <a className="download" href={downloadLink}>Download</a>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
          {video}
        </TransitionGroup>)
    } else if(isAudio) {
      content =
        (<TransitionGroup
          transitionName="fileAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="content"
          >
          <span className="text" onClick={this.handleClick.bind(this, this.state.name)}>{this.state.name}</span>
          <a className="download" href={openLink} target="_blank">Open</a>
          <a className="download" href={downloadLink}>Download</a>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
          {audio}
        </TransitionGroup>)
    } else if(isCode) {
      content =
        (<TransitionGroup
          transitionName="fileAnimation"
          transitionEnter={true}
          transitionLeave={true}
          transitionAppearTimeout={0}
          transitionEnterTimeout={2000}
          transitionLeaveTimeout={1000}
          component="div"
          className="content"
          >
          <span className="text" onClick={this.handleClick.bind(this, this.state.name)}>{this.state.name}</span>
          <a className="download" href={openLink} target="_blank">Open</a>
          <a className="download" href={downloadLink}>Download</a>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
          {code}
        </TransitionGroup>)
    } else if(isPicture) {
      content =
        (<TransitionGroup
          transitionName="fileAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="content"
          >
          <span className="text" onClick={this.handleClick.bind(this, this.state.name)}>{this.state.name}</span>
          <a className="download" href={openLink} target="_blank">Open</a>
          <a className="download" href={downloadLink}>Download</a>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
          {picture}
        </TransitionGroup>)
    } else {
      content =
        (<TransitionGroup
          transitionName="fileAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="content"
          >
          <a className="text" href={openLink} target="_blank">{this.state.name}</a>
          <a className="download" href={openLink} target="_blank">Open</a>
          <a className="download" href={downloadLink}>Download</a>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
        </TransitionGroup>)
    }

    return (
      <div className="File" key={this.state.file}>
        {content}
      </div>
    );
  }

}

export default File;
