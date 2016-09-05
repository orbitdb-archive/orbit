'use strict'

import _ from 'lodash'
import React from 'react'
import FeedStreamStore from 'stores/FeedStreamStore';
import 'styles/Stream.scss'

class Stream extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: props.user,
      feeds: [],
    }
  }

  componentDidMount() {
    this.unsubscribeFromFeedStream = FeedStreamStore.listen((feeds) => {
      this.setState({ feeds: feeds })
    })
  }

  onOpenFeed(feed, evt) {
    console.log("OPEN FEED", feed.name, feed.id)
    this.props.onOpenFeed(feed.id)
  }

  render() {
    const feeds = this.state.feeds.map((e) => {
      return <div
        className="Feed"
        key={e.id}
        onClick={this.onOpenFeed.bind(this, e)}
      >
      {e.name}
      </div>
    })

    return (
      <div className="Stream">
        <h1 className="header" onClick={this.props.onGoHome}>Home</h1>
        {feeds.length > 0
            ? <h1 className="header">Stream</h1>
            : <div className="loading">Loading feeds...</div>
        }
        {feeds}
      </div>
    )
  }
}

export default Stream
