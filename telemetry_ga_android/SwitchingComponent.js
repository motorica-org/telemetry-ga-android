import React from 'react';


export default (props) => {
  const i = Math.trunc(props.flex_count / 25) % props.sources.length;
  return props.sources[i];
}
