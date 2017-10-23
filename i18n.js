import I18n from 'react-native-i18n';


I18n.fallbacks = true;

I18n.translations = {
  en: {
    request_access_coarse_location_title: 'Bluetooth LE usage permission',
    request_access_coarse_location_message: 'We need access to BLE to connect to your prosthetic. Note though it is called "location" in Android, we don\'t track your location in any way.',
    request_access_coarse_location_restricted_warning: 'Bluetooth LE access restricted, can\'t connect',

    requesting_camera_access: 'Requesting access to camera...',

    prosthetic_id_unset_warning: 'Prosthetic id not set, check Settings',
    matrix_auth_unset_warning: 'Matrix auth data not set, check Settings',
    bad_qr_warning: 'Bad QR code',

    mainscreen_toolbar_title: 'Help the monsik grow up',
    mainscreen_toolbar_subtitle: 'With the power of your radiocarpal joint',

    settings: 'Settings',
    scanqrsettings: 'Scan QR-encoded settings',

    saving_settings_for_prosthetic: `Recognised settings for prosthetic {{prosthetic}}, saving...
Restart the app for settings to take effect.`,

    play_tamagochi: 'Play tamagochi',
    play_platformer: 'Play platformer',
    platformer_scores: 'Platformer scores',

    flex_to_play: 'Flex to play',
  },
  ru: {
    request_access_coarse_location_title: 'Разрешение на использование Bluetooth LE',
    request_access_coarse_location_message: 'Нам нужен доступ к BLE чтобы подключиться к протезу. Обратите внимание, что несмотря на то, что в Android это называется "местоположение", мы никак его не отслеживаем.',
    request_access_coarse_location_restricted_warning: 'Доступ к Bluetooth LE запрёщен, не могу подключиться.',

    requesting_camera_access: 'Получение доступа к камере...',

    prosthetic_id_unset_warning: 'Не настроено подключение к протезу, проверьте Настройки',
    matrix_auth_unset_warning: 'Не настроено подключение к Matrix, проверьте Настройки',
    bad_qr_warning: 'Ошибка чтения QR-кода',

    mainscreen_toolbar_title: 'Помоги монсику вырасти',
    mainscreen_toolbar_subtitle: 'Силой своего лучезапястного сустава',

    settings: 'Настройки',
    scanqrsettings: 'Считать настройки с QR-кода',

    saving_settings_for_prosthetic: `Нашёл настройки для протеза {{prosthetic}}, сохраняю...
Перезагрузите приложение, чтобы начать работу.`,

    play_tamagochi: 'Играть в тамагочи',
    play_platformer: 'Играть в платформер',
    platformer_scores: 'Очки за платформер',

    flex_to_play: 'Сожми, чтобы начать',
  },
};


module.exports = I18n;
