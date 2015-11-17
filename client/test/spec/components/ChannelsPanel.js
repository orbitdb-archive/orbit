'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import ChannelsPanel from 'components/ChannelsPanel.js';

describe('ChannelsPanel', () => {
    let ChannelsPanelComponent;

    beforeEach(() => {
        ChannelsPanelComponent = createComponent(ChannelsPanel);
    });

    it('should have its component name as default className', () => {
        expect(ChannelsPanelComponent._store.props.className).toBe('ChannelsPanel');
    });
});
