'use strict';

import React, { Component, PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import highlight from 'highlight.js'

class Highlight extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    language: PropTypes.string.isRequired
  }

  componentDidMount () {
    highlight.initHighlightingOnLoad()
    highlight.highlightBlock(findDOMNode(this))
  }

  componentDidUpdate () {
    // highlight.initHighlighting.called = false
    // highlight.initHighlighting()
  }

  render () {
    const { children, language } = this.props

    return (
      <pre>
        <code className={language}>
          {children}
        </code>
      </pre>
    )
  }
}

module.exports = Highlight;
