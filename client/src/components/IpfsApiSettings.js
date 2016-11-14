'use strict';

import React from 'react';
import ListForm from "components/generics/ListForm";

class IpfsApiSettings extends React.Component {

    constructor(props) {
      super(props);
      this.onElementChange = this.onElementChange.bind(this);
    }

    onElementChange(value, name) {
      logger.info('change', name, value)
      let httpHeaders = Object.assign({}, this.props.API)
      httpHeaders[name] = value
      const newApi = {HTTPHeaders: httpHeaders}
      this.props.onChange(newApi, 'API')
    }

    render() {
      const API = this.props.API
      let httpHeaders = API.httpHeaders ? API.httpHeaders : {}
      let origin = httpHeaders['Access-Control-Allow-Origin']
      origin = origin ? origin : []
      let methods = httpHeaders['Access-Control-Allow-Methods']
      methods = methods ? methods : []
      let credentials = httpHeaders['Access-Control-Allow-Creadentials']
      credentials = credentials ? credentials : []
      return (
        <div>
          <div>
            <ListForm name="Access-Control-Allow-Origin"
                      label="Access-Control-Allow-Origin"
                      list={origin}
                      onListChange={this.onElementChange}
            />
          </div>
          <div>
            <ListForm name="Access-Control-Allow-Credentials"
                      label="Access-Control-Allow-Credentials"
                      list={credentials}
                      onListChange={this.onElementChange}
            />
          </div>
          <div>
            <ListForm name="Access-Control-Allow-Methods"
                      label="Access-Control-Allow-Methods"
                      list={methods}
                      onListChange={this.onElementChange}
            />
          </div>
        </div>
      )
    }
}

export default IpfsApiSettings;
