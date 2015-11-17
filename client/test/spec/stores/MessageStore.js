'use strict';

describe('MessageStoreStore', () => {
  let store;

  beforeEach(() => {
    store = require('stores/MessageStoreStore.js');
  });

  it('should be defined', () => {
    expect(store).toBeDefined();
  });
});
