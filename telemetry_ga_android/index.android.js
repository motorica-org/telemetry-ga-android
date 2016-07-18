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

			BleManager.startNotification(device_id, service_id, char_id)
				.then(() => {
					console.log('Notification started');
				})
			.catch((e) => {
				console.log('Notification has not started' + e);
			});

			NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
					(args) => {
						console.log(args);
					}
			);
		})
		.catch((error) => {
			// Failure code
			console.log(error);
		});

});


class PeripheralState extends Component {
  constructor(props) {
    super(props);

    let old_data = 'none';
    let count = 0;

    this.state = {count: count};

    setInterval(() => {
	    BleManager.read(device_id, service_id, char_id)
		    .then((read_data) => {
			    if (read_data != old_data) {
				    count++;
				    old_data = read_data;
			    }
			    console.log('Read: ' + read_data);
			    this.setState({ count: count });
		    })
	    .catch((e) => {
		    console.log(e);
	    });
    }, 1 * 1000);
  }

  render() {
    return (
      <Text style={{fontSize: Math.pow(2, this.state.count)}}>{this.state.count}</Text>
    );
  }
}
