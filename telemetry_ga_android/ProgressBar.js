import React from 'react';
import { View } from 'react-native';


export default (props) => {
  const size = (props.flex_count % 25) / 25;

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1 - size, backgroundColor: props.style.backgroundColor, opacity: 0.2,}}/>
      <View
        style={{
          flex: size,
          ...props.style,
        }}
      />
    </View>
  );
}
