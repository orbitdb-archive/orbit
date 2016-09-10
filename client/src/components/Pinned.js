'use strict'

import React from "react"
import User from "components/User"
import ChannelActions from 'actions/ChannelActions'
import UserActions from 'actions/UserActions'
import moment from 'moment'

import "styles/Pinned.scss"

class Pinned extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      user: null,
      formattedTime: "",
    }
  }

  componentDidMount() {
    ChannelActions.loadPost(this.props.message, (err, post) => {
      if (post) {
        UserActions.getUser(post.meta.from, (err, user) => {
          this.setState({
            user: user,
            formattedTime: moment(post.meta.ts).fromNow(),
          })
        })
      }
    })
  }

  render() {
    const { user, formattedTime } = this.state

    return (
        <div className="Pinned" key={Math.random()}>
          <div style={{ width: "100%" }}>
            <div className="row">
              <User
                user={user}
                colorify={true}
                highlight={false}
                onShowProfile={this.props.onShowProfile.bind(this, user)}
              />
              <span className="pinnedText"> pinned this post </span>
              <span className="Timestamp" style={{ fontSize: "1.2em" }}>{formattedTime}</span>
            </div>
          </div>
        </div>
    )
  }

}

export default Pinned
