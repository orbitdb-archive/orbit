'use strict';

import React   from 'react/addons';
import NetworkActions from "actions/NetworkActions";
import BackgroundAnimation from 'components/BackgroundAnimation';
import Halogen from 'halogen';
import 'styles/LoginView.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;

var maxNicknameLength = 32;
var maxLogoSize = 320;

class LoginView extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      error: props.meta,
      connecting: false,
      username: null,
      password: null,
      displayPasswordField: false,
      currentLength: null,
      logoSize: Math.min(window.innerWidth, maxLogoSize)
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize.bind(this));

    if(this.refs.username) this.refs.username.focus();

    NetworkActions.registerError.listen((err) => {
      if(err.toString().replace(/\"/g, "") === "Invalid username or password")
        this.setState({ error: err.toString().replace(/\"/g, ""), connecting: false, displayPasswordField: true });
      else
      this.setState({ error: err.toString().replace(/\"/g, ""), connecting: false });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  componentDidUpdate() {
    if(this.refs.password) this.refs.password.focus();
  }

  onResize(evt) {
    var size = Math.min(window.innerWidth, maxLogoSize);
    this.setState({ logoSize: size });
  }

  register(e) {
    e.preventDefault();
    var network  = this.refs.network.value.trim();
    var username = this.refs.username.value.trim();
    var password = this.refs.password.value.trim();

    if(network !== '' && username !== '') {
      this.setState({ error: null, connecting: true, username: username, password: password });
      console.log("UI connect");
      NetworkActions.connect(network, username, password);
    }

    return;
  }

  calculateNicknameLength() {
    var remainingCharacters = maxNicknameLength - this.refs.username.value.length;
    this.setState({ currentLength: remainingCharacters < maxNicknameLength ? maxNicknameLength - this.refs.username.value.length : null });
  }

  render() {
    var color = "rgba(140, 80, 220, 0.7)";
    var errorMsg   = this.state.error ? <div className="error">{this.state.error}</div> : "";
    var passwordFieldStyle = this.state.displayPasswordField ? "row" : "hidden";

    var form = !this.state.connecting ? (
      <TransitionGroup transitionName="loginScreenAnimation" transitionAppear={true} component="div" className="inputs" transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
        <div className="row">
          <span className="label">Network</span><input type="text" ref="network" value="188.166.24.184:3005" disabled/>
        </div>
        <div className="row">
          <span className="label">Nickname</span>
          <input
            type="text"
            ref="username"
            placeholder={this.state.username ? "" : "..."}
            defaultValue={this.state.username ? this.state.username : ""}
            maxLength="32"
            onChange={this.calculateNicknameLength.bind(this)}/>
          {this.state.currentLength != null ? <span className="nicknameLength">{this.state.currentLength}</span> : ""}
        </div>
        <div className={passwordFieldStyle}>
          <span className="label">Password</span>
          <input type="password" ref="password" placeholder={this.state.password ? "" : "..."} defaultValue={this.state.password ? this.state.password : ""}/>
        </div>
        <div className="row">
          <input type="submit" value="Connect"/>
        </div>
        <div className="row">
          {errorMsg}
        </div>
      </TransitionGroup>
    ) : (
      <div className="centerrow">
        <Halogen.DotLoader color={color}/>
      </div>
    );

    return (
      <div className="LoginView">
        <form onSubmit={this.register.bind(this)} style={{ marginTop: (this.state.logoSize / 2 - 83)}}>
          <TransitionGroup className="row" transitionName="loginHeaderAnimation" transitionAppear={true} component="div" transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
            <h1>Orbits</h1>
          </TransitionGroup>
          {form}
        </form>
        <BackgroundAnimation size={this.state.logoSize}/>
      </div>
    );
  }

}

export default LoginView;
