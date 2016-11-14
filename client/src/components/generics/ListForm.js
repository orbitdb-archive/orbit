'use strict';

import React, {PropTypes} from 'react';
import _ from 'lodash';

class ListForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  initialState() {
    return {
      inputValue: '',
    };
  }

  onValueChange(e) {
    const value = e.target.value
    this.setState({
      inputValue: value
    });
  }

  add() {
    let list = [].concat(this.props.list);
    list.push(this.state.inputValue);
    this.setState(this.initialState());
    this.props.onListChange(list, this.props.name);
  }

  remove(value) {
    let list = [].concat(this.props.list);
    list = _.without(list, value);
    this.props.onListChange(list, this.props.name);
  }

  render() {
    const list = this.props.list.map((element, i) => {
      return (
        <li key={element+i}>
          <span>{element}</span>
          <span onClick={() => {this.remove(element)} }>
            <button type="button">X</button>
          </span>
        </li>
      )
    })
    const name = this.props.name;
    const label = this.props.label;
    return (
      <div className="IpfsSettingsView">
        <label htmlFor={name}>{label}</label>
        <ul>
          {list}
        </ul>
        <input name={name}
               type="text"
               value={this.state.inputValue}
               onChange={this.onValueChange}
        />
        <button type="button" onClick={this.add} className="btn">Add</button>
      </div>
    );
  }
}

ListForm.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  list: PropTypes.array.isRequired,
  onListChange: PropTypes.func.isRequired
};

export default ListForm;
