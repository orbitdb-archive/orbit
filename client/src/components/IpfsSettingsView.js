'use strict';

import React from 'react';
import IpfsDaemonStore from 'stores/IpfsDaemonStore';
import IpfsDaemonActions from 'actions/IpfsDaemonActions';
import AppActions from 'actions/AppActions';
import IpfsAddressSettings from 'components/IpfsAddressSettings';
import IpfsApiSettings from 'components/IpfsApiSettings';
import 'styles/IpfsSettingsView.scss';

import Logger from 'logplease'

const logger = Logger.create('IpfsSettingsView', { color: Logger.Colors.Black });

class IpfsSettingsView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ipfsDaemonSettings: {
        API: {},
        Addresses: {}
      }
    };
    this.updateState = this.updateState.bind(this);
    this.settingChange = this.settingChange.bind(this);
    this.onCompoundChange = this.onCompoundChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = IpfsDaemonStore.listen(this.updateState)
    IpfsDaemonActions.initConfiguration()
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  updateState(settings) {
    logger.info('on settings update', settings)
    this.setState({
      ipfsDaemonSettings: settings
    });
  }

  settingChange(e) {
    this.onCompoundChange(e.target.value, e.target.name)
  }

  onCompoundChange(value, name) {
    let ipfsDaemonSettings = Object.assign({}, this.state.ipfsDaemonSettings)
    ipfsDaemonSettings[name] = value;
    logger.info('compound change', name)
    this.updateState(ipfsDaemonSettings);
  }

  save(e) {
    e ? e.preventDefault() : e;
    IpfsDaemonActions.saveConfiguration(this.state.ipfsDaemonSettings);
    AppActions.setLocation('Connect');
  }

  render() {
    const settings = this.state.ipfsDaemonSettings;
    return (
      <form className="IpfsSettingsView" onSubmit={this.save.bind(this)}>
        <h1 className="title">IPFS daemon configurations</h1>
        <title>Directories</title>
        <div className="textInput">
          <label htmlFor="IpfsDataDir"> Ipfs data path </label>
          <input name="IpfsDataDir"
                 type="text"
                 value={settings.IpfsDataDir}
                 onChange={this.settingChange}
          />
        </div>
        <div>
          <IpfsAddressSettings Addresses={settings.Addresses}
                               onChange={this.onCompoundChange}
          />
        </div>
        <div>
          <IpfsApiSettings API={settings.API}
                           onChange={this.onCompoundChange}
          />
        </div>
        <div className="save">
          <button className="submitButton">
            save
          </button>
        </div>
      </form>
    );
  }
}

export default IpfsSettingsView;
