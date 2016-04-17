'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import { getHumanReadableBytes } from '../utils/utils.js';
import apiurl from 'utils/apiurl';
import 'styles/File.scss';
import Highlight from 'components/plugins/highlight';


var getFileUrl = apiurl.getApiUrl() + "/api/cat/";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      file: props.hash,
      size: props.size,
      showPreview: false,
      previewContent: null,
    };
  }

  handleClick(name) {
    const snippet =
    `'use strict';

const ipfsAPI = require('ipfs-api');
const Logger  = require('logplease');
const logger  = Logger.create("orbit-db example", { color: Logger.Colors.Green, showTimestamp: false, showLevel: false });
const OrbitDB = require('../src/Client');

const host     = '178.62.241.75'
const port     = 3333;
const username = 'user1';
const password = '';
const channel  = 'testing123';
const key      = 'greeting';
const value    = 'Hello world';

try {
  const ipfs = ipfsAPI();
  OrbitDB.connect(host, port, username, password, ipfs).then((orbit) => {
    orbit.channel(channel).then((db) => {
      let count = 1;
      const query = () => {
        const startTime = new Date().getTime();
        db.put(key, value + " " + count).then((res) => {
          const endTime = new Date().getTime();
          count ++;

          const result = db.get(key);
          logger.debug("---------------------------------------------------")
          logger.debug("Key | Value")
          logger.debug("---------------------------------------------------")
          logger.debug("---------------------------------------------------")
        }).catch((e) => logger.error(e));
      };
      setInterval(query, 1000);
    });
  });
} catch(e) {
  logger.error(e.stack);
}`;

    this.setState({ showPreview: !this.state.showPreview, previewContent: snippet });
  }

  render() {
    // var openLink     = getFileUrl + this.state.file + "?name=" + this.state.name;
    // var openLink     = "http://localhost:5001/api/v0/cat?arg=" + this.state.file;
    var openLink     = "http://localhost:8080/ipfs/" + this.state.file;
    var downloadLink = openLink + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);

    var split = this.state.name.split('.');
    var isVideo = split[split.length - 1] === 'mp4';
    var isAudio = split[split.length - 1] === 'mp3';
    var isCode  = split[split.length - 1] === 'js';

    var video;
    var audio;
    var code;

    if(isVideo)
      video = this.state.showPreview ? <div className="preview"><video height={200} ref="video_tag" src={openLink} controls autoplay="false"/></div> : <span/>;
    if(isAudio)
      audio = this.state.showPreview ? <div className="preview"><audio width={320} height={200} ref="audio_tag" src={openLink} controls autoplay="false"/></div> : <span/>;
    if(isCode)
      code = this.state.showPreview ? <div className="preview smallText" style={this.state.theme}>
        <Highlight language='javascript'>
          {this.state.previewContent}
        </Highlight>
      </div> : <span/>;

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
          <a className="download" href={downloadLink} target="_blank">Download</a>
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
          <a className="download" href={downloadLink} target="_blank">Download</a>
          <span className="size">{size}</span>
          {audio}
        </TransitionGroup>)
    } else if(isCode) {
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
          <a className="download" href={downloadLink} target="_blank">Download</a>
          <span className="size">{size}</span>
          {code}
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
          <a className="download" href={downloadLink} target="_blank">Download</a>
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
