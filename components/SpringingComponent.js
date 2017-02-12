import React from 'react';
import { NativeAppEventEmitter, Animated } from 'react-native';


export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flex_count: 0,
      springValue: new Animated.Value(0),
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => {
        this.setState({ flex_count: this.state.flex_count += 1 });
        this.spring();
      },
    );
  }

  async _loadInitialState() {
    this.setState({ flex_count: parseInt(await this.props.flex_count) });
  }

  componentWillMount() {
    this._loadInitialState().done(() => this.spring());
  }

  spring() {
    Animated.spring(
      this.state.springValue,
      {
        toValue: 0.025 * this.state.flex_count,
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
              scale: this.state.springValue,
            },
          ],
        }}
      >
        {this.props.sources}
      </Animated.View>
    );
  }
}
