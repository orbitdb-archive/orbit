'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import Directory from 'components/Directory.js';

describe('Directory', () => {
    let DirectoryComponent;

    beforeEach(() => {
        DirectoryComponent = createComponent(Directory);
    });

    it('should have its component name as default className', () => {
        expect(DirectoryComponent._store.props.className).toBe('Directory');
    });
});
