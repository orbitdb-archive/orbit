'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import SettingsStore from 'stores/SettingsStore';
import SettingsActions from 'actions/SettingsActions';
import BackgroundAnimation from 'components/BackgroundAnimation';
import Themes from 'app/Themes';
import 'styles/SettingsView.scss';

class SettingsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {},
      descriptions: {},
      theme: Themes[props.theme]
    };
  }

  componentDidMount() {
    this.unsubscribeFromSettingsStore = SettingsStore.listen(this.onSettingsUpdated.bind(this));
    SettingsActions.get(this.onSettingsUpdated.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeFromSettingsStore();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ theme: nextProps.theme });
  }

  onSettingsUpdated(settings, descriptions) {
    this.setState({
      settings: settings,
      descriptions: descriptions,
      theme: Themes[settings.theme]
    });
  }

  changeBooleanSetting(key, event) {
    var value = event.target.checked;
    SettingsActions.set(key, value);
  }

  changeStringSetting(key, event) {
    var value = event.target.value;
    SettingsActions.set(key, value);
  }

  render() {
    var list = Object.keys(this.state.settings).map(key => {
      var value = this.state.settings[key];
      var description = this.state.descriptions[key] || "";
      const themeValue = typeof value === 'object' ? 'Default' : value;

      var field = typeof value === 'boolean' ? (
        <div style={this.state.theme}>
          <input type="checkbox"
                 checked={value}
                 onChange={this.changeBooleanSetting.bind(this, key)}
          />
        </div>
      ) : (
        <input style={this.state.theme}
               type="text"
               defaultValue={themeValue}
               onChange={this.changeStringSetting.bind(this, key)}
        />
      );

      return (
        <TransitionGroup
          key={"t" + key}
          transitionName="rowAnimation"
          transitionAppear={true}
          transitionAppearTimeout={1000}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          component="div"
          className="row"
          >
          <span className="key">{key}</span>
          <span>{field}</span>
          <span className="description">{description}</span>
        </TransitionGroup>
      );
    });

    return (
      <div className="SettingsView">
        {list}
      </div>
    );
  }
}

export default SettingsView;
