import { AsyncStorage } from 'react-native';

export default class {
  constructor(count) {
    this.count = count;
  }

  static async fromAsyncStorage() {
    let count = await AsyncStorage.getItem('flex_count');
    if (count === null) { count = 0; }
    count = parseInt(count);

    return new this(count);
  }

  get() { return this.count; }

  set(count) {
    this.count = count;
    return AsyncStorage.setItem('flex_count', `${count}`);
  }
}
