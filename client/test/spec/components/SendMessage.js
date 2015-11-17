'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import SendMessage from 'components/SendMessage.js';

describe('SendMessage', () => {
    let SendMessageComponent;

    beforeEach(() => {
        SendMessageComponent = createComponent(SendMessage);
    });

    it('should have its component name as default className', () => {
        expect(SendMessageComponent._store.props.className).toBe('SendMessage');
    });
});
