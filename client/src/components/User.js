'use strict';

import React  from "react/addons";
import Please from "pleasejs";
import NetworkActions from "actions/NetworkActions";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from 'stores/SettingsStore';

import 'styles/User.scss';

var unknownUsername = "Anonymous";

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: this.props.userId,
      username: unknownUsername,
      colorify: props.colorify,
      highlight: props.highlight
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ colorify: nextProps.colorify, highlight: nextProps.highlight });
  }

  componentDidMount() {
    NetworkActions.getUserInfo(this.state.uid, (username) => this.setState({ username: username || unknownUsername }));
  }

  render() {
    var color = this.state.colorify ? Please.make_color({
      seed: this.state.username,
      saturation: 0.4,
      value: 0.9,
      golden: false
    }) : "";

    var className = this.state.highlight ? "User command" : "User";

    return (
      <div className={className} style={{color: color}}>{this.state.username}</div>
    );
  }
}

export default User;
