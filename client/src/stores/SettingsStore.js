'use strict';

import Reflux          from 'reflux';
import UserStore       from 'stores/UserStore';
import SettingsActions from 'actions/SettingsActions';
import Themes          from 'app/Themes';

var settingsDescriptions = {
  theme: Object.keys(Themes).join(", ")
};

var defaultSettings = {
  theme: Themes.Default,
  useEmojis: true,
  colorifyUsernames: true,
  spacing: 0.1,
  font: 'Lato',
  monospaceFont: 'Roboto Mono',
  useMonospaceFont: false
};

var SettingsStore = Reflux.createStore({
    listenables: [SettingsActions],
    init: function() {
      this.settings = {};
      this.username = "";
      UserStore.listen((user) => {
        if(user) {
          this.username = user.username;
          this.initSettings();
        }
      });
    },
    initSettings: function() {
      // Load from local storage
      this.settings = JSON.parse(localStorage.getItem("anonet.app." + this.username + ".settings")) || {};

      // Default settings
      this.settings.useEmojis = (this.settings.useEmojis !== undefined) ? this.settings.useEmojis : defaultSettings.useEmojis;
      this.settings.colorifyUsernames = (this.settings.colorifyUsernames !== undefined) ? this.settings.colorifyUsernames : defaultSettings.colorifyUsernames;
      this.settings.theme = this.settings.theme || defaultSettings.theme;
      this.settings.spacing = this.settings.spacing || defaultSettings.spacing;
      this.settings.font = this.settings.font || defaultSettings.font;
      this.settings.monospaceFont = this.settings.monospaceFont || defaultSettings.monospaceFont;
      this.settings.useMonospaceFont = this.settings.useMonospaceFont || defaultSettings.useMonospaceFont;

      // Save the defaults for this user
      localStorage.setItem("anonet.app." + this.username + ".settings", JSON.stringify(this.settings));

      this.trigger(this.settings, settingsDescriptions);
    },
    onGet: function(callback) {
      callback(this.settings, settingsDescriptions);
    },
    onSet: function(key, value) {
      this.settings[key] = value;
      localStorage.setItem("anonet.app." + this.username + ".settings", JSON.stringify(this.settings));
      this.trigger(this.settings, settingsDescriptions);
    }
});

export default SettingsStore;
