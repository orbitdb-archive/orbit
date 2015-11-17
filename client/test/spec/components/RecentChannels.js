'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import RecentChannels from 'components/RecentChannels.js';

describe('RecentChannels', () => {
    let RecentChannelsComponent;

    beforeEach(() => {
        RecentChannelsComponent = createComponent(RecentChannels);
    });

    it('should have its component name as default className', () => {
        expect(RecentChannelsComponent._store.props.className).toBe('RecentChannels');
    });
});
