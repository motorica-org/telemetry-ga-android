/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  NativeAppEventEmitter
} from 'react-native';
import BleManager from 'react-native-ble-manager';

class telemetry_ga_android extends Component {
  render() {
    return (
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
	<PeripheralState />
      </View>
    );
  }
}

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

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);

//let device_id = '00002902-0000-1000-8000-00805f9b34fb';
let device_id = '46:B4:43:88:98:2B';
let service_id = "0000180F-0000-1000-8000-00805f9b34fb";
let char_id = "00002A19-0000-1000-8000-00805f9b34fb";

setInterval(() => {
  BleManager.scan([], 2)
    .then(() => {
      // Success code
      console.log('Scan started');
    })
    .catch((e) => {
      console.log('Scan failed' + e);
    });
}, 5 * 1000);

NativeAppEventEmitter.addListener('BleManagerDiscoverPeripheral', (args) => {
	BleManager.connect(device_id)
		.then(() => {
			// Success code
			console.log('Connected');
		})
		.catch((error) => {
			// Failure code
			console.log(error);
		});

});

setInterval(() => {
BleManager.read(device_id, service_id, char_id)
	.then((read_data) => {
		console.log('Read: ' + read_data);
	})
.catch((e) => {
	console.log(e);
});
}, 5 * 1000);

class PeripheralState extends Component {
  constructor(props) {
    super(props);
    this.state = {id: 'none'};

    NativeAppEventEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (args) => {
          // The id: args.id
          // The name: args.name
	  console.log(args);
	  this.setState({ id: args.id });
      }
    );
  }

  render() {
    return (
      <Text>{this.state.id}</Text>
    );
  }
}
