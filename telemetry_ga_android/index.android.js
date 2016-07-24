/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  NativeAppEventEmitter,
  Image
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
	<SwitchingComponent
          sources={[
            <Image source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
	                    style={{width: 400, height: 400}} />,
            <Image source={{uri: 'http://facebook.github.io/react/img/logo_small.png'}}
			    style={{width: 400, height: 400}} />,
            <Image source={{uri: 'http://facebook.github.io/react/img/logo_small_2x.png'}}
			    style={{width: 400, height: 400}} />,
          ]}
        />
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

class SwitchingComponent extends Component {
  constructor(props) {
    super(props);

    const sources = this.props.sources; // FIXME: why do we need to copy here?
    this.state = { current_component: sources[0] };

    function* getNewComponent() {
      while (true) {
        for (let i of sources) {
          yield i;
        }
      }
    }

    let g = getNewComponent();
    setInterval(() => { this.setState({ current_component: g.next().value }); }, 500);
  }

  render() {
      return this.state.current_component;
  }
}

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);

//let device_id = '00002902-0000-1000-8000-00805f9b34fb';
let device_id = '67:9D:35:B0:00:09';
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
		})
		.catch((error) => {
			// Failure code
			console.log(error);
		});

});


class PeripheralState extends Component {
  constructor(props) {
    super(props);

    this.state = {count: 0};
    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
		    (args) => {
			    this.setState({ count: this.state.count + 1 });
		    }
    );
  }

  render() {
    return (
      <Text style={{fontSize: Math.pow(2, this.state.count)}}>{this.state.count}</Text>
    );
  }
}
