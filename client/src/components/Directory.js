'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import ChannelActions from 'actions/ChannelActions';
import File from 'components/File';
import { getHumanReadableBytes } from '../utils/utils.js';
import 'styles/Directory.scss';

class Directory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      hash: props.hash,
      link: null,
      size: props.size,
      children: null,
      open: false,
      loading: true
    };
  }

  componentDidMount() {
    ChannelActions.loadDirectoryInfo(this.props.hash, (err, objects) => {
      this.setState({ children: objects, loading: false });
    });
  }

  openDirectory(e) {
    e.preventDefault();
    this.setState({open: !this.state.open});
    return;
  }

  render() {
    var size     = getHumanReadableBytes(this.state.size);
    var children = [];
    var name     = (
      <TransitionGroup
        transitionName="directoryAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <a href="" onClick={this.openDirectory.bind(this)}>{this.state.name}</a>
      </TransitionGroup>
    );

    if(this.state.children && this.state.open) {
      children = this.state.children.map((e) => {
        return e.type === "file" ?
          <File hash={e.hash} name={e.name} size={e.size} key={e.hash}/> :
          <Directory hash={e.hash} name={e.name} size={e.size} key={e.hash}/>;
      });
    }

    // <a className="download" href={downloadLink} target="_blank">Download</a>
    return (
      <div className="DirectoryView">
        <div className="Directory">
          {name}
          <span className="size">{size}</span>
        </div>
        <div className={children.length > 0 ? "children" : ""}>{children}</div>
      </div>
    );
  }

}

export default Directory;
