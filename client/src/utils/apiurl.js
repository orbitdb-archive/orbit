'use strict';

var apiurl = {
  getApiUrl: function() {
    var isDevServer = (window.location.href.split(":")[2] !== undefined)
                    ? window.location.href.split(":")[2].startsWith("8000") : false;

    if(window.location.protocol === "file:")
      isDevServer = true;

    return isDevServer ? "http://localhost:3001" : "";
  },
  getSocketUrl: function() {
    var isDevServer = (window.location.href.split(":")[2] !== undefined)
                    ? window.location.href.split(":")[2].startsWith("8000") : false;

    if(window.location.protocol === "file:")
      isDevServer = true;

    return isDevServer ? "http://localhost:3001" : window.location.href.split("#")[0];
  }
};

export default apiurl;
