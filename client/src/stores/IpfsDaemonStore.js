'use strict'

import IPFS from 'ipfs-daemon/src/ipfs-browser-daemon'
import _ from 'lodash'
import Reflux from 'reflux'
import Logger from 'logplease'
import path from 'path'
import AppActions from 'actions/AppActions'
import NetworkActions from 'actions/NetworkActions'
import IpfsDaemonActions from 'actions/IpfsDaemonActions'
import {defaultIpfsDaemonSettings} from '../config/ipfs-daemon.config'
import {defaultOrbitSettings} from '../config/orbit.config'

const logger = Logger.create('IpfsDaemonStore', { color: Logger.Colors.Green })
// const LOCAL_STORAGE_KEY = 'ipfs-daemon-settings'

var IpfsDaemonStore = Reflux.createStore({
  listenables: [AppActions, IpfsDaemonActions, NetworkActions],
  init: function() {
    logger.info('IpfsDaemonStore Init sequence')

    this.isElectron = window.isElectron
    this.ipfs = null
    this.ipfsDaemonSettings = {}
    this.settings = {}

    let orbitDataDir = window.orbitDataDir || '/orbit'
    let ipfsDataDir = window.ipfsDataDir   || '/orbit/ipfs'
    let settings = [defaultIpfsDaemonSettings(ipfsDataDir), defaultOrbitSettings(orbitDataDir)]
    // const persistedSettings = this.getIpfsSettings()
    // if (persistedSettings) {
    //   settings.unshift(persistedSettings)
    // }
    // merging all settings (like defaultsDeep without merging arrays)
    settings.forEach(item => {
      _.mergeWith(this.ipfsDaemonSettings, item, (objectValue, sourceValue) => {
        return _.isArray(sourceValue) ? sourceValue : undefined
      })
    })

    if (this.isElectron) {
      ipcRenderer.on('ipfs-daemon-instance', (() => {
        logger.info('daemon callback')
        window.ipfsInstance = window.remote.getGlobal('ipfsInstance')
        this.ipfs = window.ipfsInstance
        window.gatewayAddress = this.ipfs.GatewayAddress
        IpfsDaemonActions.daemonStarted(this.ipfs)
      }).bind(this))
    }

    this.trigger(this.ipfsDaemonSettings)
  },
  onStart: function(user) {
    let settings = Object.assign({}, this.ipfsDaemonSettings)

    if (settings.IpfsDataDir.includes(settings.OrbitDataDir + '/ipfs')) {
      settings.IpfsDataDir = settings.IpfsDataDir.replace(settings.OrbitDataDir + '/ipfs', settings.OrbitDataDir)
      settings.IpfsDataDir = path.join(settings.IpfsDataDir, '/' + user, '/ipfs')
    }

    settings.OrbitDataDir = path.join(settings.OrbitDataDir, '/' + user)

    this.settings = Object.assign({}, settings)

    if (this.isElectron) {
      logger.debug("start electron ipfs-daemon")
      ipcRenderer.send('ipfs-daemon-start', settings)
    } else {
      logger.debug("start js-ipfs")
      this.ipfs = new IPFS(this.settings)
      this.ipfs.on('ready', () => IpfsDaemonActions.daemonStarted(this.ipfs))
      this.ipfs.on('error', (e) => logger.error(e))
    }
  },
  onStop: function() {
    if (this.isElectron) {
      logger.debug("stop electron ipfs-daemon")
      ipcRenderer.send('ipfs-daemon-stop')
    } else {
      logger.debug("stop js-ipfs daemon")
      throw "should stop js-ipfs daemon. not implemented yet"
    }
  },
  onSaveConfiguration: function(ipfsDaemonSettings) {
    this.ipfsDaemonSettings = Object.assign({}, ipfsDaemonSettings)
    // const stringified = JSON.stringify(ipfsDaemonSettings)
    // console.log(ipfsDaemonSettings)
    // localStorage.setItem(LOCAL_STORAGE_KEY, stringified)
    // logger.debug("persisted config")
  },
  onInitConfiguration: function(callback) {
    logger.debug("get config")
    this.trigger(this.ipfsDaemonSettings)
  },
  getIpfsSettings: function() {
    return this.settings
    // const settings = localStorage.getItem(LOCAL_STORAGE_KEY)
    // return JSON.parse(settings)
  }
})

export default IpfsDaemonStore
