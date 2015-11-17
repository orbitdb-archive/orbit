'use strict';

import React   from'react/addons';
import Actions from 'actions/SendMessageAction';
import ChannelActions from 'actions/ChannelActions';
import File    from 'components/File';
import {getHumanReadableBytes} from '../utils/utils.js';
import 'styles/Directory.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;

class Directory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "...",
      link: null,
      size: props.message.size,
      children: [],
      open: false,
      loading: true
    };
  }

  componentDidMount() {
    var raiseLoaded = (name, link, children) => {
      this.setState({children: children, name: name, link: link, loading: false});
    };

    var raiseInfoLoaded = (message) => {
      if(message)
        ChannelActions.loadDirectoryInfo(message.link, raiseLoaded.bind(null, message.content, message.link));
      else
        ChannelActions.loadMessageContent(this.props.message.hash, raiseInfoLoaded);
    };

    if(this.props.root) {
      ChannelActions.loadMessageContent(this.props.message.hash, raiseInfoLoaded);
    } else {
      ChannelActions.loadDirectoryInfo(this.props.message.hash, raiseLoaded.bind(null, this.props.message.name, this.props.message.hash));
    }
  }

  openDirectory(e) {
    e.preventDefault();
    this.setState({open: !this.state.open});
    return;
  }

  render() {
    // var downloadLink = apiURL + this.state.link + "?name=" + this.state.name + "&action=download";
    var size         = getHumanReadableBytes(this.state.size);
    var style        = this.state.loading ? "Directory loading" : "Directory";
    var children     = [];
    var name         = this.state.loading ? this.state.name
                                          : <TransitionGroup transitionName="directoryAnimation" transitionAppear={true}>
                                              <a href="" onClick={this.openDirectory.bind(this)}>{this.state.name}</a>
                                            </TransitionGroup>;

    if(this.state.children && this.state.open) {
      children = this.state.children.map((e) => {
        return e.type === "file" ? <File message={e} key={e.hash}/> : <Directory message={e} key={e.hash}/>;
      });
    }

    // <a className="download" href={downloadLink} target="_blank">Download</a>
    return (
      <div className="DirectoryView">
        <span className={style}>
          {name}
          <span className="size">{size}</span>
        </span>
        <div className={children.length > 0 ? "children" : ""}>{children}</div>
      </div>
    );
  }

}

export default Directory;
