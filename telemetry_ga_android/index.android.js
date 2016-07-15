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

setInterval(() => {
  BleManager.scan([], 5)
    .then(() => {
      // Success code
      console.log('Scan started');
    })
    .catch((e) => {
      console.log('Scan failed' + e);
    });
}, 30 * 1000);

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
