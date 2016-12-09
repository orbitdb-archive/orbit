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

const isElectron = window.isElectron

class IpfsSettingsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ipfsDaemonSettings: {
        API: {},
        Addresses: {},
        OrbitDataDir: null,
      }
    };

    if (!isElectron) {
      Object.assign(this.state, { SignalServer: null })
    }

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
    ipfsDaemonSettings[name] = value

    if (isElectron && name === 'OrbitDataDir')
      ipfsDaemonSettings.IpfsDataDir = value + '/ipfs'

    logger.info('compound change', name)
    this.updateState(ipfsDaemonSettings)
  }

  save(e) {
    e ? e.preventDefault() : e;
    IpfsDaemonActions.saveConfiguration(this.state.ipfsDaemonSettings);
    AppActions.setLocation('Connect');
  }

  render() {
    const settings = this.state.ipfsDaemonSettings;
    return (
      <div className="IpfsSettingsViewContainer">
        <form className="IpfsSettingsView" onSubmit={this.save.bind(this)}>
          <h1 className="title">Orbit Configuration</h1>
          <title>Directories</title>
          {!isElectron ?
            <div>
              <div className="textInput">
                <label htmlFor="OrbitDataDir">Orbit Data Directory</label>
                <input name="OrbitDataDir"
                       ref="orbitDataDirField"
                       type="text"
                       value={settings.OrbitDataDir}
                       onInput={this.settingChange.bind(this)}
                />
              </div>
              <title>IPFS Addresses</title>
              <div className="textInput">
                <label htmlFor="SignalServer">Signal Server Address</label>
                <input name="SignalServer"
                       type="text"
                       value={settings.SignalServer}
                       onInput={this.settingChange.bind(this)}
                />
              </div>
            </div>
            :
            <div>
              <div className="textInput">
                <label htmlFor="OrbitDataDir">Orbit Data Directory</label>
                <input name="OrbitDataDir"
                       ref="orbitDataDirField"
                       type="text"
                       value={settings.OrbitDataDir}
                       onInput={this.settingChange.bind(this)}
                />
              </div>
              <div className="textInput">
                <label htmlFor="IpfsDataDir">IPFS Repository Path</label>
                <input name="IpfsDataDir"
                       type="text"
                       value={settings.IpfsDataDir}
                       onInput={this.settingChange.bind(this)}
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
            </div>
          }
        </form>
        <div className="save">
          <button className="submitButton"
                  onClick={this.save.bind(this)}>
            Save
          </button>
        </div>
      </div>
    );
  }
}

export default IpfsSettingsView;
