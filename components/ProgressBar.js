// @flow
import React from 'react';
import { View } from 'react-native';
import type { StyleSheet } from 'react-native';


export default ({ flex_count, style }:
                { flex_count: number,
                  style: StyleSheet }) => {
  const size = (flex_count % 25) / 25;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 - size, backgroundColor: style.backgroundColor, opacity: 0.2 }} />
      <View
        style={{
          flex: size,
          ...style,
        }}
      />
    </View>
  );
};
