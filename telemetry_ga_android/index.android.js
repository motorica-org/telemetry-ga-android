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
  Image
} from 'react-native';

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
      return this.state.current_component
  }
}

AppRegistry.registerComponent('telemetry_ga_android', () => telemetry_ga_android);
