'use strict'

import React from 'react'
import TransitionGroup from "react-addons-css-transition-group"
import ChannelActions from 'actions/ChannelActions'
import File from 'components/File'
import { getHumanReadableBytes } from '../utils/utils.js'
import 'styles/Directory.scss'

const isElectron = !!window.ipfsInstance

class Directory extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: props.name,
      hash: props.hash,
      link: null,
      size: props.size,
      children: [],
      open: false,
      loading: true
    }
  }

  componentDidMount() {
    ChannelActions.loadDirectoryInfo(this.props.hash, (err, objects) => {
      this.setState({ children: objects, loading: false })
    })
  }

  openDirectory(e) {
    e.preventDefault()
    this.setState({open: !this.state.open}, () => this.props.onPreviewOpened(this.refs.directory))
    return
  }

  onOpen(e) {
    const gateway = isElectron ? 'http://localhost:' + window.gatewayAddress.split(':')[1] : 'https://ipfs.io./ipfs/'
    const url = gateway + this.props.hash + '/'
    // If we're in Electron
    if (window.remote) {
      const BrowserWindow = remote.BrowserWindow
      let win = new BrowserWindow({ webPreferences: { webSecurity: false } })
      win.loadURL(url)
    } else {
      window.open(url)
    }
  }

  render() {
    const gateway   = isElectron ? 'http://' + window.gatewayAddress : 'https://ipfs.io./ipfs/'
    const openLink  = gateway + this.props.hash + '/'
    const size      = getHumanReadableBytes(this.state.size)
    const className = `clipboard-${this.props.hash} download`;
    let children    = []

    const name = (
      <TransitionGroup
        transitionName="directoryAnimation"
        transitionAppear={true}
        transitionAppearTimeout={1000}
        transitionEnterTimeout={0}
        transitionLeaveTimeout={0}
        >
        <a href="" onClick={this.openDirectory.bind(this)}>{this.state.name}</a>
      </TransitionGroup>
    )

    if(this.state.open) {
      children = this.state.children.map((e) => {
        return e.type === "file" ?
          <File hash={e.hash} name={e.name} size={e.size} key={e.hash} onPreviewOpened={this.props.onPreviewOpened}/> :
          <Directory hash={e.hash} name={e.name} size={e.size} key={e.hash} onPreviewOpened={this.props.onPreviewOpened}/>
      })
    }

    const showIndexHtml = this.state.children.map((e) => e.name).includes('index.html') && this.state.open

    return (
      <div className="DirectoryView">
        <div className="Directory">
          {name}
          <span className="download" href={openLink} onClick={this.onOpen.bind(this)}>Open</span>
          <span className={className}>Hash</span>
          <span className="size">{size}</span>
        </div>
        <div style={{ display: "flex" }}>
          <div className={children.length > 0 ? "children" : ""} ref="directory">{children}</div>
          {showIndexHtml ? <webview src={openLink} disablewebsecurity className="webview"/> : null}
        </div>
      </div>
    )
  }

}

export default Directory
