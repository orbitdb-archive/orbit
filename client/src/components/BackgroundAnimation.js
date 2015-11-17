'use strict';

import React  from 'react';
import 'styles/BackgroundAnimation.scss';

var TransitionGroup = React.addons.CSSTransitionGroup;


class BackgroundAnimation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.size,
      height: props.size,
      startX: props.startX ? props.startX : props.size / 2,
      startY: props.startY ? props.startY : props.size / 2,
      theme: props.theme
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      width: nextProps.size,
      height: nextProps.size,
      startX: nextProps.startX ? nextProps.startX : nextProps.size / 2,
      startY: nextProps.startY ? nextProps.startY : nextProps.size / 2,
      theme: nextProps.theme
    });
  }

  render() {
    var maxSize   = (this.state.width || window.innerWidth) / 2;
    var minSize   = 32;
    var amount    = 7;
    var opacity   = 1;
    var colors    = [
      "rgba(50, 32, 56, " + opacity + ")",
      "rgba(62, 32, 76, " + opacity + ")",
      "rgba(87, 32, 110, " + opacity + ")",
      "rgba(118, 32, 154, " + opacity + ")",
      "rgba(156, 56, 203, " + opacity + ")",
      "rgba(188, 84, 238, " + opacity + ")",
      "rgba(225, 170, 253, " + opacity + ")"
    ].reverse();

    var circles = [0, 1, 2, 3, 4, 5, 6].reverse().map((i) => {
      var inc    = (maxSize - minSize) / (amount - 1);
      var radius = minSize + (i * inc);
      var color  = colors[i];
      return (
        <circle
          cx={this.state.startX}
          cy={this.state.startY}
          r={radius}
          fill={color}
          key={"circle" + i}
          style={{ animationDelay: 0.2 + 0.1 * i + "s" }}
        />
      );
    });

    return (
      <div className="BackgroundAnimation" ref="container">
        <svg width={this.state.width} height={this.state.width} key="circles" style={this.state.theme}>
          {circles}
        </svg>
      </div>
    );
  }

}

export default BackgroundAnimation;
