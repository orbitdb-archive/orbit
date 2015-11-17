'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import Channel from 'components/Channel.js';

describe('Channel', () => {
    let ChannelComponent;

    beforeEach(() => {
        ChannelComponent = createComponent(Channel);
    });

    it('should have its component name as default className', () => {
        expect(ChannelComponent._store.props.className).toBe('Channel');
    });
});
