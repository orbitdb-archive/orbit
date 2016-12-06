'use strict';

// Default window settings or electron startup
module.exports = {
  connectWindowSize: {
    width: 512,
    height: 512,
    center: true,
    resize: false,
    webPreferences: {
      webSecurity: false,
    }
  },
  mainWindowSize: {
    width: 1200,
    height: 800,
    center: true,
    resize: true,
    webPreferences: {
      webSecurity: false,
    }
  }
}
