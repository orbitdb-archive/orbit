'use strict'

import Orbit from 'orbit_'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import IpfsDaemonStore from 'stores/IpfsDaemonStore'
import IpfsDaemonActions from 'actions/IpfsDaemonActions'
import path from 'path'
import Logger from 'logplease'

const logger = Logger.create('OrbitStore', { color: Logger.Colors.Blue })
const ipcRenderer = window.ipcRenderer

const OrbitStore = Reflux.createStore({
  listenables: [AppActions, IpfsDaemonActions],
  init: function() {
    this.orbit = null
    this.trigger(this.orbit)
  },
  onDisconnect: function() {
    this.orbit.disconnect()
  },
  onDaemonStarted: function(ipfs) {
    const options = {
      // path where to keep generates keys
      keystorePath: path.join(IpfsDaemonStore.getIpfsSettings().OrbitDataDir, "/data/keys"),
      // path to orbit-db cache file
      cachePath: path.join(IpfsDaemonStore.getIpfsSettings().OrbitDataDir, "/data/orbit-db"),
      // how many messages to retrieve from history on joining a channel
      maxHistory: 64,
    }

    this.orbit = new Orbit(ipfs, options)

    this.orbit.events.on('connected', (network, user) => {
      if(ipcRenderer)
        ipcRenderer.send('connected', network, user)
    })

    this.orbit.events.on('disconnected', () => {
      if(ipcRenderer)
        ipcRenderer.send('disconnected')
    })

    AppActions.initialize(this.orbit)
    this.trigger(this.orbit)
  },
})

export default OrbitStore
