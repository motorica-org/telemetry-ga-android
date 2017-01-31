import React from 'react';
import { View, Button } from 'react-native';

import I18n from './i18n.js';


export default class extends React.Component {
  static route = {
    navigationBar: {
      title: I18n.t('settings'),
    }
  }

  render() {
    return (
      <View>
        <Button
          onPress={() => this.props.navigator.push(this.props.navigator.router.getRoute('scanqrsettings'))}
          title={I18n.t('scanqrsettings')}
          color="#303f9f"
        />
      </View>
    );
  }
}
