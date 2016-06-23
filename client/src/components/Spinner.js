'use strict';

import React, { PropTypes } from 'react';
import Halogen from 'halogen';

class Spinner extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    color: PropTypes.string,
    size: PropTypes.string,
  };

  static defaultProps = {
    className: 'spinner',
  };

  render() {
    const { className, isLoading, color, size } = this.props;
    return (
      <div className={className}>
        <Halogen.MoonLoader className="spinnerIcon" loading={isLoading} color={color} size={size} />
      </div>
    );
  }

}

export default Spinner;
