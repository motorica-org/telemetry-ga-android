import React from 'react';
import {
  AsyncStorage,
  Dimensions,
  StyleSheet,
  ToastAndroid,
  PermissionsAndroid,
} from 'react-native';
import Camera from 'react-native-camera';

import I18n from './i18n.js';

import Matrix from './Matrix';


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
  componentWillMount() {
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA).done();
  }

  render() {
    return (
      <Camera
        style={styles.preview}
        quality={Camera.constants.CaptureQuality.low} // supposed to make things faster
        barCodeTypes={['qr']}
        onBarCodeRead={(code) => {
          try {
            const d = JSON.parse(code.data); // throws
            if (d.type === 'qrconfig.motorica.org' && d.version >= 0.2 && d.prosthetic.kind === 'mechanical') {
              const m = d.matrix;
              const matrix = Matrix.passwordLogin(m.home_server, m.user, m.password)
                .then(JSON.parse)
                .then(x => ({ ...x, home_server: m.home_server, room_stream_to: m.room_stream_to }))
                .then(JSON.stringify);

              matrix
                .then(x => AsyncStorage.setItem('matrix', x))
                .then(() => AsyncStorage.setItem('prosthetic_mac', d.prosthetic.mac))
                .then(() => {
                  ToastAndroid.show(I18n.t('saving_settings_for_prosthetic', {prosthetic: d.prosthetic.mac}), ToastAndroid.SHORT);
                  this.props.navigator.pop(); // we are done here
                })
                .catch(() => ToastAndroid.show(I18n.t('bad_qr_warning'), ToastAndroid.SHORT)); // FIXME: this might be a passwordLogin, a JSON parsing or a saving error
            } else {
              throw QRNotRecognizedError();
            }
          } catch (e) {
            if ((e instanceof QRNotRecognizedError) ||
                (e instanceof SyntaxError && e.message.includes('JSON'))) { // facepalm
              ToastAndroid.show(I18n.t('bad_qr_warning'), ToastAndroid.SHORT);
            }
          }
        }}
      />
    );
  }
}
