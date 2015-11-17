'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import User from 'components/User.js';

describe('User', () => {
    let UserComponent;

    beforeEach(() => {
        UserComponent = createComponent(User);
    });

    it('should have its component name as default className', () => {
        expect(UserComponent._store.props.className).toBe('User');
    });
});
