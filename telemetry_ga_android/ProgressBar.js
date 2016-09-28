import React from 'react';
import { NativeAppEventEmitter, View } from 'react-native';


export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flex_count: 0,
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
    const size = this.state.flex_count / 25;
    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1 - size, backgroundColor: this.props.style.backgroundColor, opacity: 0.2,}}/>
        <View
          style={{
            flex: size,
            ...this.props.style,
          }}
        />
      </View>
      );
  }
}
