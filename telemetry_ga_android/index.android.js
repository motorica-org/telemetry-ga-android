/**
 * https://gitlab.com/motorica-org/telemetry-ga-android
 * @flow
 */

import React from 'react';
import { AppRegistry, NativeAppEventEmitter } from 'react-native';
import BleManager from 'react-native-ble-manager';

import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@exponent/ex-navigation';

import MainScreen from './MainScreen';
import SettingsScreen from './SettingsScreen';

import FlexCount from './FlexCount';
import Matrix from './Matrix';


const fc = FlexCount.fromAsyncStorage();

Matrix.initClient().done();
Matrix.initRoomClient().done();

BleManager.start().done();
BleManager.enableBluetooth().done();


const Router = createRouter(() => ({
  main: () => MainScreen,
  settings: () => SettingsScreen,
}));

const App = () =>
  <NavigationProvider router={Router}>
    <StackNavigation initialRoute={Router.getRoute('main')} />
  </NavigationProvider>;

AppRegistry.registerComponent('telemetry_ga_android', () => App);


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
  fc.then((_fc) => {
    _fc.set(_fc.get() + 1).done();
    console.log(_fc.get());
  });
});

NativeAppEventEmitter.addListener('BleManagerDisconnectPeripheral', () => {
  // FIXME: might be a good idea to check for deviceId here.
  console.log('Disconnected');
  isConnected = false;
});
