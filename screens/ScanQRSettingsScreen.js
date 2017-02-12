import React from 'react';
import {
  AsyncStorage,
  Dimensions,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  PermissionsAndroid,
} from 'react-native';
import Camera from 'react-native-camera';

import I18n from '../i18n';

import Matrix from '../Matrix';


const styles = StyleSheet.create({
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class QRNotRecognizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QRNotRecognizedError';
  }
}

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.state = { hasPermission: false };
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
      .then(result => this.setState({ hasPermission: result === PermissionsAndroid.RESULTS.GRANTED }));
  }

  render() {
    return (
      this.state.hasPermission ?
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
                  ToastAndroid.show(I18n.t('saving_settings_for_prosthetic', { prosthetic: d.prosthetic.mac }), ToastAndroid.SHORT);
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
        /> :
        <View style={styles.center}>
          <Text style={{ fontSize: 20 }}>
            {I18n.t('requesting_camera_access')}
          </Text>
        </View>
    );
  }
}
