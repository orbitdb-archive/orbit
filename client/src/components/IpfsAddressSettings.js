'use strict';

import React, {PropTypes} from 'react';
import ListForm from "components/generics/ListForm";
import Logger from 'logplease'

const logger = Logger.create('IpfsAddressSettings', { color: Logger.Colors.Red });

class IpfsAddressSettings extends React.Component {

  constructor(props) {
    super(props);
    this.onAddressChange = this.onAddressChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  onAddressChange(value, name) {
    logger.info('change', name, value)
    let newAddress = Object.assign({}, this.props.Addresses)
    newAddress[name] = value
    this.props.onChange(newAddress, 'Addresses')
  }

  onInputChange(e) {
    this.onAddressChange(e.target.value, e.target.name);
  }

  render() {
    const Addresses = this.props.Addresses ? this.props.Addresses : {};
    const swarm = Addresses.Swarm ? Addresses.Swarm : []
    return (
      <div>
        <title>IPFS Addresses</title>
        <div className="textInput">
          <label htmlFor="API"> Ipfs API address </label>
          <input name="API"
                 placeholder="e.g. /ip4/127.0.0.1/tcp/0"
                 type="text"
                 value={Addresses.API}
                 onChange={this.onInputChange}
          />
        </div>
        <div className="textInput">
          <label htmlFor="Gateway"> Ipfs Gateway address </label>
          <input name="Gateway"
                 placeholder="e.g. /ip4/127.0.0.1/tcp/0"
                 type="text"
                 value={Addresses.Gateway}
                 onChange={this.onInputChange}
          />
        </div>
        <div>
          <ListForm name="Swarm"
                    label="Swarm Addresses"
                    placeholder="e.g. /ip4/127.0.0.1/tcp/0"
                    list={swarm}
                    onListChange={this.onAddressChange}
          />
        </div>
      </div>
    )
  }
}

export default IpfsAddressSettings;
