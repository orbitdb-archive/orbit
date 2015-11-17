'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import Message from 'components/Message.js';

describe('Message', () => {
    let MessageComponent;

    beforeEach(() => {
        MessageComponent = createComponent(Message);
    });

    it('should have its component name as default className', () => {
        expect(MessageComponent._store.props.className).toBe('Message');
    });
});
