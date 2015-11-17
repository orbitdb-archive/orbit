'use strict';

// Uncomment the following lines to use the react test utilities
// import React from 'react/addons';
// const TestUtils = React.addons.TestUtils;

import createComponent from 'helpers/createComponent';
import SettingsView from 'components/SettingsView.js';

describe('SettingsView', () => {
    let SettingsViewComponent;

    beforeEach(() => {
        SettingsViewComponent = createComponent(SettingsView);
    });

    it('should have its component name as default className', () => {
        expect(SettingsViewComponent._store.props.className).toBe('SettingsView');
    });
});
