'use strict';

import React  from 'react';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
import 'styles/BackgroundAnimation.scss';

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

    const inc = (maxSize - minSize) / (amount - 1);
    const rings = [0, 1, 2, 3, 4, 5, 6];

    var circles = rings.reverse().map((i) => {
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

    let styleSheet = document.styleSheets[0];
    var dots = rings.map((i) => {
      const color = "rgba(255, 255, 255, 0.66)";
      const pos = minSize + (i * inc);
      const speed = (Math.random() * 12) + 6;
      const size = (Math.random() * 2) + 0.5;

      let keyframes = `@keyframes rot${i} {
        0% {
          transform: rotate(0deg)
                     translate(-${pos}px)
                     rotate(0deg);
        }
        100% {
          transform: rotate(360deg)
                     translate(-${pos}px)
                     rotate(-360deg);
        }
      }`;
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

      return (
        <circle
          cx={this.state.startX}
          cy={this.state.startY}
          r={size}
          fill={color}
          style={{
            animation: `rot${i} linear`,
            animationDuration: `${speed}s`,
            animationDelay: `${i/2}s`,
            animationIterationCount: "infinite"
          }}
          key={"dot" + i}>
        </circle>
      );
    });

    return (
      <div className="BackgroundAnimation" ref="container">
        <svg width={this.state.width} height={this.state.width} key="circles" style={this.state.theme} className="transparent">
          {circles}
        </svg>
        <svg width={this.state.width} height={this.state.width} key="dots" style={this.state.theme} className="opaque">
          {dots}
        </svg>
      </div>
    );
  }

}

export default BackgroundAnimation;
