'use strict';

import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import IpfsDaemonActions from 'actions/IpfsDaemonActions';
import Logger from 'logplease';

const logger = Logger.create('IpfsDaemonStore', { color: Logger.Colors.Green });

var IpfsDaemonStore = Reflux.createStore({
  listenables: [AppActions, IpfsDaemonActions],
  init: function() {
    logger.warn(window.ipfsDaemonSettings)
    const windowSettings = window.ipfsDaemonSettings
    this.ipfsDaemonSettings = windowSettings ? windowSettings : {};
  },
  onStart: function(callback) {
    if (window.isElectron) {
      logger.debug("start electron ipfs-daemon signal")
      ipcRenderer.send('ipfs-daemon-start', this.ipfsDaemonSettings)
    } else {
      logger.debug("start js-ipfs")
      throw "should start js-ipfs. not implemented yet"
    }
    ipcRenderer.once('ipfs-daemon-instance', (event, data) => {callback(data)})
  },
  onSetConfig: function(ipfsDaemonSettings) {
    this.ipfsDaemonSettings = ipfsDaemonSettings
    logger.debug("set config", this.ipfsDaemonSettings)
  },
  onGetConfig: function(callback) {
    logger.debug("get config")
    callback(this.ipfsDaemonSettings)
  }
})

export default IpfsDaemonStore;