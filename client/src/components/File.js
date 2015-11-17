'use strict';

import React   from'react/addons';
import ChannelActions from 'actions/ChannelActions';
import {getHumanReadableBytes} from '../utils/utils.js';
import apiurl from 'utils/apiurl';
import 'styles/File.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;
var getFileUrl      = apiurl.getApiUrl() + "/api/get/";
var pinFileUrl      = apiurl.getApiUrl() + "/api/pin/";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      name: "...",
      link: null,
      size: props.message.size,
      loading: true
    };
  }

  componentDidMount() {
    if(!this.props.message.name) {
      ChannelActions.loadMessageContent(this.state.message.hash, (message) => {
        this.setState({name: message.content, link: message.link, loading: false});
      });
    } else {
      this.setState({name: this.state.message.name, link: this.state.message.hash, loading: false});
    }
  }

  render() {
    var openLink     = getFileUrl + this.state.link + "?name=" + this.state.name;
    var downloadLink = openLink + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);
    var style        = this.state.loading ? "File loading" : "File";
    var content      = this.state.loading ?
      this.state.name :
      <TransitionGroup transitionName="fileAnimation" transitionAppear={true}>
        <a href={openLink} target="_blank">{this.state.name}</a>
      </TransitionGroup>;

    return (
      <div>
        <div className={style} key={this.state.message.hash}>
          {content}
          <a className="download" href={downloadLink}>Download</a>
          <span className="size">{size}</span>
        </div>
      </div>
    );
  }

}

export default File;
