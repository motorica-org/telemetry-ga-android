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
        if (this.state.flex_count % 25 === 0) { this.setState({ flex_count: 0 }); }
        this.setState({ flex_count: this.state.flex_count += 1 });
      }
    );
  }

  async _loadInitialState() {
    this.setState({ flex_count: parseInt(await this.props.flex_count) % 25 });
  }

  componentWillMount() {
    this._loadInitialState().done();
  }

  render() {
    return (
      <Animated.Image
        source={this.props.source}
        style={{
          resizeMode: "contain",
          width: 9 * this.state.flex_count + 75, // FIXME: flex
          height: 9 * this.state.flex_count + 75, // FIXME: flex
        }}
      />
      );
  }
}
