// @flow
export default ({ flex_count, sources }:
                { flex_count: number,
                  sources: Array<ReactClass<*>> }) => {
  const i = Math.trunc(flex_count / 25) % sources.length;
  return sources[i];
};
