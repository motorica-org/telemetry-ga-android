/**
 * https://gitlab.com/motorica-org/telemetry-ga-android
 * @flow
 */

import React from 'react';
import { AppRegistry, AsyncStorage, NativeAppEventEmitter, ToastAndroid } from 'react-native';
import BleManager from 'react-native-ble-manager';

import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@exponent/ex-navigation';

import MainScreen from './MainScreen';
import SettingsScreen from './SettingsScreen';
import ScanQRSettingsScreen from './ScanQRSettingsScreen';

import FlexCount from './FlexCount';
import Matrix from './Matrix';


const fc = FlexCount.fromAsyncStorage();

Matrix.passwordLogin('https://localhost', 'vasiliy.pupkin', 'iamverysecret')
  .then((x) => Matrix.initClient('https://localhost', x))
  .then(() => Matrix.initRoomClient('!TmaZBKYIFrIPVGoUYp:localhost'));

BleManager.start().done();
BleManager.enableBluetooth().done();


const Router = createRouter(() => ({
  main: () => MainScreen,
  settings: () => SettingsScreen,
  scanqrsettings: () => ScanQRSettingsScreen,
}));

const App = () =>
  <NavigationProvider router={Router}>
    <StackNavigation initialRoute={Router.getRoute('main')} />
  </NavigationProvider>;

AppRegistry.registerComponent('telemetry_ga_android', () => App);


AsyncStorage.getItem('prosthetic_mac')
  .then(deviceId => (deviceId === null ? Promise.reject() : deviceId))
  .then(
    (deviceId) => {
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
    },
    () => ToastAndroid.show('Prostetic id not set, check Settings', ToastAndroid.LONG)
  );
