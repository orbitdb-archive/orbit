'use strict';

import React, {PropTypes} from 'react';
import _ from 'lodash';

class ListForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    // this.renderList = this.renderList.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    console.log(this.props.list)
  }

  initialState() {
    return {
      inputValue: '',
    };
  }

  onValueChange(e) {
    console.log('on value change')
    const value = e.target.value
    this.setState({
      inputValue: value
    });
  }

  add() {
    console.log('add list call')
    let list = [].concat(this.props.list);
    list.push(this.state.inputValue);
    this.setState(this.initialState());
    this.props.onListChange(list, this.props.name);
  }

  remove(value) {
    console.log('remove list call')
    let list = [].concat(this.props.list);
    list = _.without(list, value);
    this.props.onListChange(list, this.props.name);
  }

  render() {
    const list = this.props.list.map((element) => {
      return (
        <li>
          <span>{element}</span>
          <span onClick={() => {this.remove(element)} }>X</span>
        </li>
      )
    })
    console.log(list)
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
