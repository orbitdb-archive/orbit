'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import SwarmStore from 'stores/SwarmStore';
import 'styles/SwarmView.scss';
import Logger from 'logplease';

const logger = Logger.create('Swarm', { color: Logger.Colors.Green });

class SwarmView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      peers: []
    };
  }

  componentDidMount() {
    this.unsubscribeFromSwarmStore = SwarmStore.listen((peers) => this.setState({ peers: peers }));
    this.setState({ peers: SwarmStore.peers })
  }

  componentWillUnmount() {
    this.unsubscribeFromSwarmStore();
  }

  render() {
    var peers = this.state.peers.map((p) => {
      return (
        <TransitionGroup
          key={"t" + p}
          transitionName="peerAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="peer"
          >
          <svg width="20" height="8" key={"svg" + p}><circle cx="4" cy="4" r="4" fill="rgba(116, 228, 96, 0.8)"/></svg>
          <span key={p}>{p}</span>
        </TransitionGroup>
      );
    });

    return (
      <div className="SwarmView">
        <div className="summary">Peers connected <span className="green">{this.state.peers.length}</span></div>
        <div className="peers">
          {peers}
        </div>
      </div>
    );
  }

}

export default SwarmView;
