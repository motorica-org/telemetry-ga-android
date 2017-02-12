import React from 'react';

import { View, Button, ToolbarAndroid } from 'react-native';

import I18n from '../i18n';


const settingsIcon = require('../img/ic_settings_black_24dp.png');


export default props =>
  <View style={{ flex: 1 }}>
    <ToolbarAndroid
      title={I18n.t('mainscreen_toolbar_title')}
      subtitle={I18n.t('mainscreen_toolbar_subtitle')}
      style={{ backgroundColor: '#e9eaed', height: 56 }}
      actions={[
            { title: I18n.t('settings'), icon: settingsIcon, show: 'always' },
      ]}
      onActionSelected={
            (position) => {
              switch (position) {
                case 0: props.navigator.push(props.navigator.router.getRoute('settings')); break;
                default: break;
              }
            }
          }
    />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Button
        onPress={() => props.navigator.push(props.navigator.router.getRoute('tamagochi'))}
        title={I18n.t('play_tamagochi')}
        color='#c2185b'
      />
      <Button
        onPress={() => props.navigator.push(props.navigator.router.getRoute('platformer'))}
        title={I18n.t('play_platformer')}
        color='#00796b'
      />
    </View>
  </View>;
