import React from 'react';
import {
  AsyncStorage,
  Dimensions,
  StyleSheet,
  ToastAndroid,
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

class QRNotRecognizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QRNotRecognizedError';
  }
}

// Cannot be made a stateless component due to navigator being injected via props.
// eslint-disable-next-line react/prefer-stateless-function
export default class extends React.Component {
  render() {
    return (
      <Camera
        style={styles.preview}
        quality={Camera.constants.CaptureQuality.low} // supposed to make things faster
        barCodeTypes={['qr']}
        onBarCodeRead={(code) => {
          try {
            const d = JSON.parse(code.data); // throws
            if (d.type === 'qrconfig.motorica.org' && d.version >= 0.1 && d.prosthetic.kind === 'mechanical') {
              AsyncStorage.setItem('prosthetic_mac', d.prosthetic.mac).done(); // throws
              ToastAndroid.show(`Recognised settings for prosthetic ${d.prosthetic.mac}, saving...`, ToastAndroid.SHORT);
              this.props.navigator.pop(); // we are done here
            } else {
              throw QRNotRecognizedError();
            }
          } catch (e) {
            if ((e instanceof QRNotRecognizedError) ||
                (e instanceof SyntaxError && e.message.includes('JSON'))) { // facepalm
              ToastAndroid.show('Bad QR code', ToastAndroid.SHORT);
            }
          }
        }}
      />
    );
  }
}
