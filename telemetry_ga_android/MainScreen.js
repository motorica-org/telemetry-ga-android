import React from 'react';

import { View, ScrollView, ToolbarAndroid, NativeAppEventEmitter } from 'react-native';

import SwitchingComponent from './SwitchingComponent';
import EnlargingImage from './EnlargingImage';
import ProgressBar from './ProgressBar';

import I18n from './i18n.js';

import FlexCount from './FlexCount';


const monsikPinkSmall = require('./img/monsik/pink/small.png');
const monsikPinkMedium = require('./img/monsik/pink/medium.png');
const monsikPinkBig = require('./img/monsik/pink/big.png');
const settingsIcon = require('./img/ic_settings_black_24dp.png');

const fc = FlexCount.fromAsyncStorage();


export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flex_count: 0,
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => { this.setState({ flex_count: this.state.flex_count + 1 }); }
    );
  }

  componentWillMount() {
    this.loadInitialState().done();
  }

  async loadInitialState() {
    this.setState({ flex_count: parseInt((await fc).get()) });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <ToolbarAndroid
          title={I18n.t('mainscreen_toolbar_title')}
          subtitle={I18n.t('mainscreen_toolbar_subtitle')}
          style={{ backgroundColor: '#e9eaed', height: 56 }}
          actions={[
            { title: I18n.t('settings'), icon: settingsIcon, show: 'always' },
          ]}
          onActionSelected={
            (position) => {
              switch (position) {
                case 0: this.props.navigator.push(this.props.navigator.router.getRoute('settings')); break;
                default: break;
              }
            }
          }
        />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <ScrollView />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <SwitchingComponent
                flex_count={this.state.flex_count}
                sources={[
                  <EnlargingImage flex_count={this.state.flex_count} source={monsikPinkSmall} />,
                  <EnlargingImage flex_count={this.state.flex_count} source={monsikPinkMedium} />,
                  <EnlargingImage flex_count={this.state.flex_count} source={monsikPinkBig} />,
                ]}
              />
            </View>
          </View>
          <View style={{ flex: 0.05, flexDirection: 'column', justifyContent: 'flex-end' }}>
            <ProgressBar flex_count={this.state.flex_count} style={{ backgroundColor: '#4cade2' }} />
          </View>
        </View>
      </View>
    );
  }
}
