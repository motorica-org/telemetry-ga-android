/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, NativeAppEventEmitter, Image } from 'react-native';
import BleManager from 'react-native-ble-manager';

import PulsingImage from './PulsingImage';


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

class SwitchingComponent extends Component {
  constructor(props) {
    super(props);

    const sources = this.props.sources; // FIXME: why do we need to copy here?
    this.state = {
      current_component: sources[0],
    };

    function* getNewComponent() {
      while (true) {
        for (const i of sources) {
          yield i;
        }
      }
    }

    const g = getNewComponent();
    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => {
        this.setState({
          current_component: g.next().value,
        });
      }
    );
  }

  render() {
    return this.state.current_component;
  }
}

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);

// let deviceId = '00002902-0000-1000-8000-00805f9b34fb';
const deviceId = 'A4:5E:60:B9:B8:24';
const serviceId = 'e35c8bac-a062-4e3f-856d-2cfa87f2f171';
const charId = '58d3c1f4-b253-4055-9d02-3932126539f8';

setInterval(() => {
  BleManager.scan([], 2)
    .then(() => {
      // Success code
      console.log('Scan started');
    })
    .catch((e) => {
      console.log(`Scan failed ${e}`);
    });
}, 5 * 1000);

NativeAppEventEmitter.addListener('BleManagerDiscoverPeripheral', () => {
  BleManager.connect(deviceId)
    .then(() => {
      // Success code
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
      // Failure code
      console.log(error);
    });
});
