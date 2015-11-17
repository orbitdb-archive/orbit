'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import TextMessage from 'components/TextMessage.js';

describe('TextMessage', () => {
    let TextMessageComponent;

    beforeEach(() => {
        TextMessageComponent = createComponent(TextMessage);
    });

    it('should have its component name as default className', () => {
        expect(TextMessageComponent._store.props.className).toBe('TextMessage');
    });
});
