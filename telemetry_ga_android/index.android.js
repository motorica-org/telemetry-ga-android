/**
 * https://gitlab.com/motorica-org/telemetry-ga-android
 * @flow
 */

import React from 'react';
import { AppRegistry, StyleSheet, View, ScrollView, Text, ToolbarAndroid, NativeAppEventEmitter } from 'react-native';
import BleManager from 'react-native-ble-manager';

import SwitchingComponent from './SwitchingComponent';
import EnlargingImage from './EnlargingImage';
import ProgressBar from './ProgressBar';

import FlexCount from './FlexCount';
import Matrix from './Matrix';


const fc = FlexCount.fromAsyncStorage();

Matrix.initClient().done();
Matrix.initRoomClient().done();

BleManager.start().done();
BleManager.enableBluetooth().done();


class telemetry_ga_android extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flex_count: 0,
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => { this.setState({ flex_count: this.state.flex_count += 1 }); }
    );
  }

  async _loadInitialState() {
    this.setState({ flex_count: parseInt((await fc).get()) });
  }

  componentWillMount() {
    this._loadInitialState().done();
  }

  render() {
    return (
    <View style={{flex: 1,}}>
      <ToolbarAndroid
        title='Помоги монсику вырасти'
        subtitle='силой своего лучезапястного сустава'
        style={{backgroundColor: '#e9eaed', height: 56,}}/>
      <View style={{flex: 1, flexDirection: 'row',}}>
        <View style={{flex: 1}}>
          <ScrollView></ScrollView>
          <View style={{justifyContent:'center', alignItems:'center',}}>
            <SwitchingComponent flex_count={this.state.flex_count}
              sources={[
                <EnlargingImage flex_count={this.state.flex_count} source={require('./img/monsik/pink/small.png')}/>,
                <EnlargingImage flex_count={this.state.flex_count} source={require('./img/monsik/pink/medium.png')}/>,
                <EnlargingImage flex_count={this.state.flex_count} source={require('./img/monsik/pink/big.png')}/>,
              ]}
            />
          </View>
        </View>
        <View style={{flex: 0.05, flexDirection:'column', justifyContent: 'flex-end',}}>
          <ProgressBar flex_count={this.state.flex_count} style={{backgroundColor: '#4cade2'}}/>
        </View>
      </View>
    </View>
    );
  }
}

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);


// let deviceId = '00002902-0000-1000-8000-00805f9b34fb';
const deviceId = 'A4:5E:60:B9:B8:24';
const serviceId = 'e35c8bac-a062-4e3f-856d-2cfa87f2f171';
const charId = 'e35c8910-a062-4e3f-856d-2cfa87f2f171';

let isConnected = false;

setInterval(() => {
  if (!isConnected) {
    BleManager.scan([], 2)
      .then(() => {
        console.log('Scan started');
      })
      .catch((e) => {
        console.log(`Scan failed ${e}`);
      });
  }
}, 5 * 1000);

NativeAppEventEmitter.addListener('BleManagerDiscoverPeripheral', () => {
  BleManager.connect(deviceId)
    .then(() => {
      isConnected = true;
      console.log('Connected');

      BleManager.startNotification(deviceId, serviceId, charId)
        .then(() => {
          console.log('Notification started');
        })
        .catch((e) => {
          console.log(`Notification has not started ${e}`);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', (notification) => {
  Matrix.sendMessage('motorica-org.mechanical.v1.flex',
    {
      body: 'flex',
      timestamp: Date.now(),
      power: parseInt(notification.value, 16), // decode from BLE's hex
    }).done();
  fc.then((fc) => {
    fc.set(fc.get() + 1).done();
    console.log(fc.get());
  });
});

NativeAppEventEmitter.addListener('BleManagerDisconnectPeripheral', () => {
  // FIXME: might be a good idea to check for deviceId here.
  console.log('Disconnected');
  isConnected = false;
});
