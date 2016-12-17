import React from 'react';
import {
  Dimensions,
  StyleSheet,
} from 'react-native';
import Camera from 'react-native-camera';


const styles = StyleSheet.create({
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
});

// Cannot be made a stateless component due to navigator being injected via props.
// eslint-disable-next-line react/prefer-stateless-function
export default class extends React.Component {
  render() {
    return (
      <Camera
        style={styles.preview}
        quality={Camera.constants.CaptureQuality.low} // supposed to make things faster
        barCodeTypes={['qr']}
        onBarCodeRead={_ => this.props.navigator.pop()}
      />
    );
  }
}
