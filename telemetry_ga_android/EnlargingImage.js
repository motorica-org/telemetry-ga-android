import React from 'react';
import { Animated } from 'react-native';


export default (props) => {
  const size_multiplier = props.flex_count % 25;

  return (
    <Animated.Image
      source={props.source}
      style={{
        resizeMode: "contain",
        width: 9 * size_multiplier + 75, // FIXME: flex
        height: 9 * size_multiplier + 75, // FIXME: flex
      }}
    />
  );
}
