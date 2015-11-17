'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import File from 'components/File.js';

describe('File', () => {
    let FileComponent;

    beforeEach(() => {
        FileComponent = createComponent(File);
    });

    it('should have its component name as default className', () => {
        expect(FileComponent._store.props.className).toBe('File');
    });
});
