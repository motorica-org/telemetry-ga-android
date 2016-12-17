import React from 'react';
import { View, Button } from 'react-native';


export default class extends React.Component {
  static route = {
    navigationBar: {
      title: 'Settings',
    }
  }

  render() {
    return (
      <View>
        <Button
          onPress={() => this.props.navigator.push(this.props.navigator.router.getRoute('scanqrsettings'))}
          title="Scan QR-encoded settings"
          color="#303f9f"
        />
        <Button
          onPress={() => this.props.navigator.push(this.props.navigator.router.getRoute('main'))}
          title="Connect the prosthetic"
          color="#7b1fa2"
        />
      </View>
    );
  }
}
