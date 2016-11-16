'use strict';

import Reflux from 'reflux';
import _ from 'lodash';
import Logger from 'logplease';

import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions';
import IpfsDaemonActions from 'actions/IpfsDaemonActions';
import {defaultIpfsDaemonSettings} from '../config/ipfs-daemon.config';

const logger = Logger.create('IpfsDaemonStore', { color: Logger.Colors.Green });
const LOCAL_STORAGE_KEY = 'ipfs-daemon-settings';

var IpfsDaemonStore = Reflux.createStore({
  listenables: [AppActions, IpfsDaemonActions],
  init: function() {
    logger.info('IpfsDaemonStore Init sequence')
    let ipfsDataDir = window.ipfsDataDir;
    this.isElectron = window.isElectron;
    this.ipfsDaemonSettings = {};
    const settings = [defaultIpfsDaemonSettings(ipfsDataDir)];
    if (localStorage.getItem(LOCAL_STORAGE_KEY)) {
      settings.push(localStorage.getItem(LOCAL_STORAGE_KEY));
    }
    settings.forEach(item => {
      _.mergeWith(this.ipfsDaemonSettings, item, (objectValue, sourceValue) => {
        return _.isArray(sourceValue) ? sourceValue : undefined;
      });
    });
    this.onPersist();
    this.trigger(this.ipfsDaemonSettings);
  },
  onStart: function(callback) {
    if (window.isElectron) {
      logger.debug("start electron ipfs-daemon signal")
      ipcRenderer.send('ipfs-daemon-start', this.ipfsDaemonSettings)
      ipcRenderer.once('ipfs-daemon-instance', () => {
        logger.info('daemon callback')
        const ipfs = remote.getGlobal('ipfsInstance')
        NetworkActions.setIpfs(ipfs, callback)
      })
    } else {
      logger.debug("start js-ipfs")
      throw "should start js-ipfs. not implemented yet"
    }
  },
  onPersist: function() {
    const stringified = JSON.stringify(this.ipfsDaemonSettings)
    localStorage.setItem(LOCAL_STORAGE_KEY, stringified)
    logger.debug("persisted config")
  },
  onRetrieve: function() {
    logger.debug("retrieved config")
    const rawJson = localStorage.getItem(LOCAL_STORAGE_KEY)
    return JSON.parse(rawJson)
  },
  onSetConfig: function(ipfsDaemonSettings) {
    this.ipfsDaemonSettings = ipfsDaemonSettings
    logger.debug("set config", this.ipfsDaemonSettings)
    this.trigger(this.ipfsDaemonSettings);
  },
  onInitConfig: function(callback) {
    logger.debug("get config")
    this.trigger(this.ipfsDaemonSettings)
  }
})

export default IpfsDaemonStore;
