import React from 'react';

import { AsyncStorage, View, ListView, Text, ToolbarAndroid } from 'react-native';

import I18n from '../i18n';

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      platformerscores: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    };
  }

  componentWillMount() {
    this.loadInitialState().done();
  }

  async loadInitialState() {
    this.setState({
      platformerscores: this.state.platformerscores.cloneWithRows(await AsyncStorage.getItem('platformerscores').then(JSON.parse).then(x => Array.isArray(x) ? x : []).then(x => x.reverse())),
    });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <ToolbarAndroid
          title={I18n.t('platformer_scores')}
          style={{ backgroundColor: '#e9eaed', height: 56 }}
        />
        <ListView
          dataSource={this.state.platformerscores}
          renderRow={
            score =>
              <Text
                style={{
                  fontSize: 18 + score,
                  alignSelf: 'center',
                }}
              >
                {score}
              </Text>
          }
        />
      </View>
    );
  }
}
