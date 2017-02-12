import React from 'react';
import { NativeAppEventEmitter, Animated } from 'react-native';


export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pulseValue: new Animated.Value(0),
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => {
        this.pulse();
      },
    );
  }

  pulse() {
    this.state.pulseValue.setValue(0.0);
    Animated.timing(
      this.state.pulseValue,
      {
        toValue: 1.0,
        duration: 500,
      },
    ).start();
  }

  render() {
    return (
      <Animated.View
        style={{
          flex: 1,
          transform: [
            {
              scale: this.state.pulseValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.05, 1],
              }),
            },
          ],
        }}
      >
        {this.props.sources}
      </Animated.View>
    );
  }
}
