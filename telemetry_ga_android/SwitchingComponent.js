import React from 'react';
import { NativeAppEventEmitter } from 'react-native';


export default class extends React.Component {
  constructor(props) {
    super(props);

    function* getNewComponent() {
      while (true) {
        for (const i of sources) {
          yield i;
        }
      }
    }

    const g = getNewComponent();

    const sources = this.props.sources; // FIXME: why do we need to copy here?
    this.state = {
      flex_count: 0,
      current_component: g.next().value,
    };

    NativeAppEventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',
      () => {
        this.setState({ flex_count: this.state.flex_count += 1 });
        if (this.state.flex_count % 25 === 0) {
          this.setState({
            current_component: g.next().value,
          });
        }
      }
    );
  }

  async _loadInitialState() {
    this.setState({ flex_count: parseInt(await this.props.flex_count) });
  }

  componentWillMount() {
    this._loadInitialState().done();
  }

  render() {
    return this.state.current_component;
  }
}
