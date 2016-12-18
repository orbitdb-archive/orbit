'use strict'

import React from 'react'
import TransitionGroup from "react-addons-css-transition-group"
// import NetworkStore from 'stores/NetworkStore'
// import NetworkActions from 'actions/NetworkActions'
// import UserActions from 'actions/UserActions'
// import AppActions from 'actions/AppActions'
import BackgroundAnimation from 'components/BackgroundAnimation'
import Themes from 'app/Themes'
import 'styles/LoadingView.scss'

class LoadingView extends React.Component{
  constructor(props) {
    super(props)
    this.state = this._getInitialState(props)
  }

  _getInitialState(props) {
    return {
      text: [],
      theme: Themes.Default,
      loading: true,
    }
  }

  componentDidMount() {
    if (window.ipcRenderer) {
      window.ipcRenderer.on('log', (e, source, level, text) => {
        const event = { source: source, level: level, text: text }
        this.setState({ text: this.state.text.concat([event])})
      })      
      window.ipcRenderer.on('ipfs-daemon-instance', () => {
        // fired when daemon has started
        this.setState({ loading: false })
      })
    }
  }

  componentWillUnmount() {
  }

  render() {
    if (!this.state.loading)
      return null

    const logs = this.state.text.map((e) => {
      const className = e.level.toLowerCase() === 'error' ? "text error" : "text"
      return <div className={className}>{e.level} {e.text}</div>
    })

    const transitionProps =  {
      transitionAppear: true,
      transitionAppearTimeout: 5000,
      transitionEnterTimeout: 5000,
      transitionLeaveTimeout: 5000,
    }

    return (
      <div className="LoadingView">
        <TransitionGroup className="header" component="div" transitionName="loadingHeaderAnimation" {...transitionProps}>
          <h1>Loading...</h1>
        </TransitionGroup>
        <TransitionGroup className="logs" component="div" transitionName="loadingTextAnimation" {...transitionProps}>
          {logs}
        </TransitionGroup>
        <BackgroundAnimation size={480} circleSize={2} theme={this.state.theme}/>
      </div>
    )
  }
}

export default LoadingView
