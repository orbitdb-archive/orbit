'use strict';

import React from 'react';
import IpfsDaemonStore from 'stores/IpfsDaemonStore';
import IpfsDaemonActions from 'actions/IpfsDaemonActions';
import AppActions from "actions/AppActions";

class IpfsSettingsView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ipfsDaemonSettings: {}
    };
    this.onSettingsUpdated = this.onSettingsUpdated.bind(this);
    this.settingChange = this.settingChange.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = IpfsDaemonStore.listen(this.onSettingsUpdated);
    IpfsDaemonActions.getConfig(this.onSettingsUpdated);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSettingsUpdated(settings) {
    this.setState({
      ipfsDaemonSettings: settings
    });
  }

  settingChange(e) {
    let ipfsDaemonSettings = {}
    ipfsDaemonSettings[e.target.name] = e.target.value;
    this.setState({
      ipfsDaemonSettings: ipfsDaemonSettings
    });
    IpfsDaemonActions.setConfig(this.state.ipfsDaemonSettings);
  }

  save(e) {
    IpfsDaemonActions.setConfig(this.state.ipfsDaemonSettings);
    AppActions.setLocation('Connect');
  }

  render() {
    return (
      <div className="IpfsSettingsView">
      <h3>IPFS daemon configurations</h3>
        <div>
          <label htmlFor="IpfsDataDir"> Ipfs data path </label>
          <input name="IpfsDataDir"
                 type="text"
                 value={this.state.ipfsDaemonSettings.IpfsDataDir}
                 onChange={this.settingChange}
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
