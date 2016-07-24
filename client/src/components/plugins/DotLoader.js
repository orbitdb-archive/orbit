'use strict';

var React = require('react');
var assign = require('domkit/appendVendorPrefix');
var insertKeyframesRule = require('domkit/insertKeyframesRule');

/**
 * @type {Object}
 */
var rotateKeyframes = {
    '100%': {
        transform: 'rotate(360deg)'
    }
};

/**
 * @type {Object}
 */
var bounceKeyframes = {
    '0%, 100%': {
        transform: 'scale(0)'
    },
    '50%': {
        transform: 'scale(1.0)'
    }
};

/**
 * @type {String}
 */
var rotateAnimationName = insertKeyframesRule(rotateKeyframes);

/**
 * @type {String}
 */
var bounceAnimationName = insertKeyframesRule(bounceKeyframes);

var Loader = React.createClass({
    displayName: 'Loader',

    /**
     * @type {Object}
     */
    propTypes: {
        loading: React.PropTypes.bool,
        color: React.PropTypes.string,
        size: React.PropTypes.string,
        margin: React.PropTypes.string
    },

    /**
     * @return {Object}
     */
    getDefaultProps: function getDefaultProps() {
        return {
            loading: true,
            color: '#ffffff',
            size: '60px'
        };
    },

    /**
     * @param  {String} size
     * @return {Object}
     */
    getBallStyle: function getBallStyle(size) {
        return {
            backgroundColor: this.props.color,
            width: size,
            height: size,
            borderRadius: '100%',
            verticalAlign: this.props.verticalAlign
        };
    },

    /**
     * @param  {Number} i
     * @return {Object}
     */
    getAnimationStyle: function getAnimationStyle(i) {
        const speed = 4;
        var animation = [i == 0 ? rotateAnimationName : bounceAnimationName, `${speed}s`, i == 2 ? `-${speed/2}s` : '0s', 'infinite', 'linear'].join(' ');
        var animationFillMode = 'forwards';

        return {
            animation: animation,
            animationFillMode: animationFillMode
        };
    },

    /**
     * @param  {Number} i
     * @return {Object}
     */
    getStyle: function getStyle(i) {
        var size = parseInt(this.props.size);
        var ballSize = this.props.ballSize;

        if (i) {
            return assign(this.getBallStyle(ballSize), this.getAnimationStyle(i), {
                position: 'absolute',
                top: i % 2 ? 0 : 'auto',
                bottom: i % 2 ? 'auto' : 0
            });
        }

        return assign(this.getAnimationStyle(i), {
            width: size,
            height: size,
            position: 'relative'
        });
    },

    /**
     * @param  {Boolean} loading
     * @return {ReactComponent || null}
     */
    renderLoader: function renderLoader(loading) {
        if (loading) {
            return React.createElement(
                'div',
                { id: this.props.id, className: this.props.className },
                React.createElement(
                    'div',
                    { style: this.getStyle(0) },
                    React.createElement('div', { style: this.getStyle(1) }),
                    React.createElement('div', { style: this.getStyle(2) })
                )
            );
        }

        return null;
    },

    render: function render() {
        return this.renderLoader(this.props.loading);
    }
});

module.exports = Loader;