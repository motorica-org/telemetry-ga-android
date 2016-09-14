/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React from 'react';
import { AppRegistry, StyleSheet, View, ScrollView, Text, NativeAppEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';

import SwitchingComponent from './SwitchingComponent';
import EnlargingImage from './EnlargingImage';

import FlexCount from './FlexCount';
const fc = FlexCount.fromAsyncStorage();

const Matrix = NativeModules.MatrixReactWrapper;
Matrix.initClient().done();
Matrix.initRoomClient().done();


const telemetry_ga_android = () =>
  <View style={{flex: 1}}>
    <View>
      <Text>Помоги Монсику вырасти силой своего лучезапястного сустава!</Text>
    </View>
    <ScrollView>
    </ScrollView>
    <View style={{justifyContent:'center', alignItems:'center',}}>
      <SwitchingComponent flex_count={ fc.then((fc) => fc.get()) }
        sources={[
          <EnlargingImage flex_count={ fc.then((fc) => fc.get() + 1) } source={require('./img/monsik/pink/small.png')}/>,
          <EnlargingImage flex_count={ fc.then((fc) => fc.get() + 1) } source={require('./img/monsik/pink/medium.png')}/>,
          <EnlargingImage flex_count={ fc.then((fc) => fc.get() + 1) } source={require('./img/monsik/pink/big.png')}/>,
        ]}
      />
    </View>
  </View>;

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);


// let deviceId = '00002902-0000-1000-8000-00805f9b34fb';
const deviceId = 'A4:5E:60:B9:B8:24';
const serviceId = 'e35c8bac-a062-4e3f-856d-2cfa87f2f171';
const charId = '58d3c1f4-b253-4055-9d02-3932126539f8';

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

NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', () => {
  Matrix.sendMessage('motorica-org.mechanical.v1.flex',
    {
      body: 'flex',
      timestamp: Date.now(),
      power: 255,
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
