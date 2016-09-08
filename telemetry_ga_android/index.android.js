/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React from 'react';
import { AppRegistry, StyleSheet, Text, View, Image, NativeAppEventEmitter, NativeModules, AsyncStorage } from 'react-native';
import BleManager from 'react-native-ble-manager';

import SwitchingComponent from './SwitchingComponent';
import PulsingComponent from './PulsingComponent';

const Matrix = NativeModules.MatrixReactWrapper;
Matrix.initClient().done();
Matrix.initRoomClient().done();


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

const telemetry_ga_android = () =>
  <View style={styles.container}>
    <Text style={styles.welcome}>
      Welcome to Prosthetic Metrics GA!
    </Text>
    <Text style={styles.instructions}>
      To get started, edit index.android.js
    </Text>
    <Text style={styles.instructions}>
      Shake or press menu button for dev menu
    </Text>
    <PulsingComponent
      sources={[
        <Image key='./img/monsik/pink/small.png' source={require('./img/monsik/pink/small.png')} />, // TODO: do we have to specify `key`?
      ]}
    />
    <SwitchingComponent
      sources={[
        <Image source={require('./img/monsik/pink/small.png')} />,
        <Image source={require('./img/monsik/pink/medium.png')} />,
        <Image source={require('./img/monsik/pink/big.png')} />,
      ]}
    />
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

async function incrementFlexCount() {
  let item = await AsyncStorage.getItem('flex_count');
  if (item === null) { item = 0; }
  return AsyncStorage.setItem('flex_count', `${parseInt(item) + 1}`);
}

NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', async () => {
  Matrix.sendMessage('motorica-org.mechanical.v1.flex',
    {
      body: 'flex',
      timestamp: Date.now(),
      power: 255,
    }).done();
  incrementFlexCount().done();
  console.log(await AsyncStorage.getItem('flex_count'));
});

NativeAppEventEmitter.addListener('BleManagerDisconnectPeripheral', () => {
  // FIXME: might be a good idea to check for deviceId here.
  console.log('Disconnected');
  isConnected = false;
});
