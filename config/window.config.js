'use strict';

// Default window settings or electron startup
module.exports = {
  connectWindowSize: {
    width: 512,
    height: 512,
    center: true,
    resize: false,
    "web-preferences": {
      "web-security": false,
      zoomFactor: 3.0
    }
  },
  mainWindowSize: {
    width: 1200,
    height: 800,
  }
}
