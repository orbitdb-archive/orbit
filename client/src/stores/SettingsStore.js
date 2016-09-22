'use strict'

import Reflux from 'reflux'
import UserStore from 'stores/UserStore'
import SettingsActions from 'actions/SettingsActions'
import Themes from 'app/Themes'

const appName = 'anonet.app'

const defaultSettings = {
  theme: Themes.Default,
  useEmojis: true,
  colorifyUsernames: true,
  spacing: 0.1,
  font: 'Lato',
  monospaceFont: 'Roboto Mono',
  useMonospaceFont: false,
  leftSidePanel: false
}

const settingsDescriptions = {
  theme: Object.keys(Themes).join(', ')
}

const SettingsStore = Reflux.createStore({
  listenables: [SettingsActions],
  init: function() {
    this.settings = {}
    this.username = 'default'
    UserStore.listen((user) => {
      if(user) {
        this.username = user.name
        this.loadSettings()
      }
    })
  },
  loadSettings: function() {
    // Load from local storage
    this.settings = Object.assign({}, defaultSettings)
    const settings = JSON.parse(localStorage.getItem(this._getSettingsKey())) || {}
    Object.assign(this.settings, settings)
    this._save() // Save the defaults for a new user

    this.trigger(this.settings, settingsDescriptions)
  },
  onGet: function(callback) {
    callback(this.settings, settingsDescriptions)
  },
  onSet: function(key, value) {
    this.settings[key] = value
    this._save()
    this.trigger(this.settings, settingsDescriptions)
  },
  _getSettingsKey: function() {
    return `${appName}.${this.username}.settings`
  },
  _save: function() {
    localStorage.setItem(this._getSettingsKey(), JSON.stringify(this.settings))
  }
})

export default SettingsStore
