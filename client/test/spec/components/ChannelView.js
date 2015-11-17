'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import ChannelView from 'components/ChannelView.js';

describe('ChannelView', () => {
    let ChannelViewComponent;

    beforeEach(() => {
        ChannelViewComponent = createComponent(ChannelView);
    });

    it('should have its component name as default className', () => {
        expect(ChannelViewComponent._store.props.className).toBe('ChannelView');
    });
});
