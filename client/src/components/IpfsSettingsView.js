'use strict';

import React from 'react';
import IpfsDaemonStore from 'stores/IpfsDaemonStore';
import IpfsDaemonActions from 'actions/IpfsDaemonActions';
import AppActions from 'actions/AppActions';
import IpfsAddressSettings from 'components/IpfsAddressSettings';
import Logger from 'logplease'

const logger = Logger.create('IpfsSettingsView', { color: Logger.Colors.Purple });

class IpfsSettingsView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ipfsDaemonSettings: {}
    };
    this.onSettingsUpdated = this.onSettingsUpdated.bind(this);
    this.settingChange = this.settingChange.bind(this);
    this.onCompoundChange = this.onCompoundChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = IpfsDaemonStore.listen(this.onSettingsUpdated);
    IpfsDaemonActions.initConfig()
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSettingsUpdated(settings) {
    logger.info('on settings update', settings)
    this.setState({
      ipfsDaemonSettings: settings
    });
  }

  settingChange(e) {
    this.onCompoundChange(e.target.value, e.target.name)
  }

  newSettings(ipfsDaemonSettings) {
    logger.info('newSettings', ipfsDaemonSettings)
    IpfsDaemonActions.setConfig(ipfsDaemonSettings);
  }

  onCompoundChange(value, name) {
    let ipfsDaemonSettings = Object.assign({}, this.state.ipfsDaemonSettings)
    ipfsDaemonSettings[name] = value;
    logger.info('compound change', name)
    this.newSettings(ipfsDaemonSettings);
  }

  save(e) {
    IpfsDaemonActions.persist();
    AppActions.setLocation('Connect');
  }

  render() {
    const settings = this.state.ipfsDaemonSettings;
    const Addresses = settings.Addresses ? settings.Addresses : {};
    return (
      <div className="IpfsSettingsView">
      <h3>IPFS daemon configurations</h3>
        <div>
          <label htmlFor="IpfsDataDir"> Ipfs data path </label>
          <input name="IpfsDataDir"
                 type="text"
                 value={settings.IpfsDataDir}
                 onChange={this.settingChange}
          />
        </div>
        <div>
          <IpfsAddressSettings Addresses={Addresses}
                               onChange={this.onCompoundChange}
          />
        </div>
        <div>
          <button type="button" onClick={this.save.bind(this)}>
            retour
          </button>
        </div>
      </div>
    );
  }
}

export default IpfsSettingsView;
