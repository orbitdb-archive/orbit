'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import SwarmView from 'components/SwarmView.js';

describe('SwarmView', () => {
    let SwarmViewComponent;

    beforeEach(() => {
        SwarmViewComponent = createComponent(SwarmView);
    });

    it('should have its component name as default className', () => {
        expect(SwarmViewComponent._store.props.className).toBe('SwarmView');
    });
});
