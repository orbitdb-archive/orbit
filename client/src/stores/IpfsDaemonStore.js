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

    this.isElectron = window.isElectron;
    this.ipfs = null;
    this.ipfsDaemonSettings = {};
    this.username = null;

    let ipfsDataDir = window.ipfsDataDir;
    const settings = [defaultIpfsDaemonSettings(ipfsDataDir)];
    const hasIpfsSettings = this.hasIpfsSettings()
    if (hasIpfsSettings) {
      settings.push(localStorage.getItem(LOCAL_STORAGE_KEY));
    }
    // merging all settings (like defaultsDeep without merging arrays)
    settings.forEach(item => {
      _.mergeWith(this.ipfsDaemonSettings, item, (objectValue, sourceValue) => {
        return _.isArray(sourceValue) ? sourceValue : undefined;
      });
    });
    if (!hasIpfsSettings){
      this.onPersist()
    }
    if (this.isElectron) {
      ipcRenderer.once('ipfs-daemon-instance', (() => {
        logger.info('daemon callback')
        this.ipfs = window.remote.getGlobal('ipfsInstance')
        IpfsDaemonActions.daemonStarted(this.ipfs)
      }).bind(this))
    }
    this.trigger(this.ipfsDaemonSettings);
  },
  onStart: function() {
    if (this.isElectron) {
      logger.debug("start electron ipfs-daemon signal")
      ipcRenderer.send('ipfs-daemon-start', this.ipfsDaemonSettings)
    } else {
      logger.debug("start js-ipfs")
      throw "should start js-ipfs. not implemented yet"
    }
  },
  // onDaemonStarted: function() {
  //   logger.debug("ipfs daemon started")
  //   this.trigger(this.ipfs)
  // },
  onPersist: function() {
    const stringified = JSON.stringify(this.ipfsDaemonSettings)
    localStorage.setItem(LOCAL_STORAGE_KEY, stringified)
    logger.debug("persisted config")
  },
  onRetrieve: function() {
    logger.debug("retrieved config")
    const rawJson = localStorage.getItem(LOCAL_STORAGE_KEY)
    return (rawJson) ? JSON.parse(rawJson) : undefined
  },
  onSetConfig: function(ipfsDaemonSettings) {
    this.ipfsDaemonSettings = ipfsDaemonSettings
    logger.debug("set config", this.ipfsDaemonSettings)
    this.trigger(this.ipfsDaemonSettings);
  },
  onInitConfig: function(callback) {
    logger.debug("get config")
    this.trigger(this.ipfsDaemonSettings)
  },
  hasIpfsSettings: function() {
    const settings = localStorage.getItem(LOCAL_STORAGE_KEY)
    return settings && typeof settings === 'object'
  }
})

export default IpfsDaemonStore;
