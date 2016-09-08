import React from 'react';
import { NativeAppEventEmitter } from 'react-native';


export default class extends React.Component {
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
