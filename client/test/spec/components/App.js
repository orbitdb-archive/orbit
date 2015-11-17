'use strict';

describe('App', () => {
  let React = require('react/addons');
  let App, component;

  beforeEach(() => {
    let container = document.createElement('div');
    container.id = 'content';
    document.body.appendChild(container);

    App = require('components/App.js');
    component = React.createElement(App);
  });

  it('should create a new instance of App', () => {
    expect(component).toBeDefined();
  });
});
