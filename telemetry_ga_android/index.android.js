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
  Image,
  Animated,
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
	<PulsingImage source={require('./img/monsik/pink/small.png')} />
	<SwitchingComponent
          sources={[
            <Image source={require('./img/monsik/pink/small.png')} />,
            <Image source={require('./img/monsik/pink/medium.png')} />,
            <Image source={require('./img/monsik/pink/big.png')} />,
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
    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
		    (args) => {
			    this.setState({ current_component: g.next().value });
		    }
    );
  }

  render() {
      return this.state.current_component;
  }
}

class PulsingImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pulseValue: new Animated.Value(0),
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
		    (args) => {
			    this.pulse();
		    }
    );
  }

  render() {
    return (
      <Animated.Image
        source={this.props.source}
        style={{
          flex: 1,
          transform: [
            {scale: this.state.pulseValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.05, 1],
              }),
	    },
          ]
        }}
      />
    );
  }

  pulse() {
    this.state.pulseValue.setValue(0.0);
    Animated.timing(
      this.state.pulseValue,
      {
        toValue: 1.0,
	duration: 500
      }
    ).start();
  }
}

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);

//let device_id = '00002902-0000-1000-8000-00805f9b34fb';
let device_id = '67:9D:35:B0:00:09';
let service_id = 'e35c8bac-a062-4e3f-856d-2cfa87f2f171';
let char_id = '58d3c1f4-b253-4055-9d02-3932126539f8';

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
