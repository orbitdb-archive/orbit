'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import JoinChannel from 'components/JoinChannel.js';

describe('JoinChannel', () => {
    let JoinChannelComponent;

    beforeEach(() => {
        JoinChannelComponent = createComponent(JoinChannel);
    });

    it('should have its component name as default className', () => {
        expect(JoinChannelComponent._store.props.className).toBe('JoinChannel');
    });
});
