'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
import { getHumanReadableBytes } from '../utils/utils.js';
import apiurl from 'utils/apiurl';
import 'styles/File.scss';
import Video from 'react-videojs';

import { PlayButton, Progress, Icons } from 'react-soundplayer/components';
import { SoundPlayerContainer } from 'react-soundplayer/addons';

const { SoundCloudLogoSVG } = Icons;

var getFileUrl = apiurl.getApiUrl() + "/api/cat/";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      file: props.hash,
      size: props.size,
      showPreview: false,
    };
  }

  handleClick(name) {
    this.setState({ showPreview: !this.state.showPreview });
  }

  render() {
    // var openLink     = getFileUrl + this.state.file + "?name=" + this.state.name;
    var openLink     = "http://localhost:5001/api/v0/cat?arg=" + this.state.file;
    var downloadLink = openLink + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);

    var split = this.state.name.split('.');
    var isVideo = split[split.length - 1] === 'mp4';
    var isAudio = split[split.length - 1] === 'mp3';

    var video;
    var audio;

    if(isVideo)
      video = this.state.showPreview ? <div className="preview"><video height={200} ref="video_tag" src={openLink} controls autoplay="false"/></div> : <span/>;
    if(isAudio)
      audio = this.state.showPreview ? <div className="preview"><audio width={320} height={200} ref="audio_tag" src={openLink} controls autoplay="false"/></div> : <span/>;

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
          <a className="download" href={downloadLink}>Download</a>
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
          <a className="download" href={downloadLink}>Download</a>
          <span className="size">{size}</span>
          {audio}
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
          <a className="text" href={openLink}>{this.state.name}</a>
          <a className="download" href={downloadLink}>Download</a>
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
