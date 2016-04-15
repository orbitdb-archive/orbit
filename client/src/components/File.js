'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import ChannelActions from 'actions/ChannelActions';
import {getHumanReadableBytes} from '../utils/utils.js';
import apiurl from 'utils/apiurl';
import 'styles/File.scss';

var getFileUrl = apiurl.getApiUrl() + "/api/cat/";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      file: props.hash,
      size: props.size
    };
  }

  render() {
    var openLink     = getFileUrl + this.state.file + "?name=" + this.state.name;
    // var openLink     = "http://localhost:5001/api/v0/cat?arg=" + this.state.file + "?stream=true";
    var downloadLink = openLink + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);
    var content      = (
      <TransitionGroup
        transitionName="fileAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <a href={openLink} target="_blank">{this.state.name}</a>
      </TransitionGroup>
    );

    return (
      <div>
        <div className="File" key={this.state.file}>
          {content}
          <a className="download" href={downloadLink}>Download</a>
          <span className="size">{size}</span>
        </div>
      </div>
    );
  }

}

export default File;
