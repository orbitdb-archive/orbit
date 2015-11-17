'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import LoginView from 'components/LoginView.js';

describe('LoginView', () => {
    let LoginViewComponent;

    beforeEach(() => {
        LoginViewComponent = createComponent(LoginView);
    });

    it('should have its component name as default className', () => {
        expect(LoginViewComponent._store.props.className).toBe('LoginView');
    });
});
