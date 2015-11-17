'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import Header from 'components/Header.js';

describe('Header', () => {
    let HeaderComponent;

    beforeEach(() => {
        HeaderComponent = createComponent(Header);
    });

    it('should have its component name as default className', () => {
        expect(HeaderComponent._store.props.className).toBe('Header');
    });
});
