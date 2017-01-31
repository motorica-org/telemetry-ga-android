import I18n from 'react-native-i18n';


I18n.fallbacks = true;

I18n.translations = {
  en: {
    request_access_coarse_location_title: 'Bluetooth LE usage permission',
    request_access_coarse_location_message: 'We need access to BLE to connect to your prosthetic. Note though it is called "location" in Android, we don\'t track your location in any way.',
    request_access_coarse_location_restricted_warning: 'Bluetooth LE access restricted, can\'t connect',

    mainscreen_toolbar_title: 'Help the monsik grow up',
    mainscreen_toolbar_subtitle: 'With the power of your radiocarpal joint',

    settings: 'Settings',
    scanqrsettings: 'Scan QR-encoded settings',
  },
  ru: {

    settings: 'Настройки',
    scanqrsettings: 'Считать настройки с QR-кода',
  }
};


module.exports = I18n;
