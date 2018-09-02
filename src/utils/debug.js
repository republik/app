/* global __DEV__ */

export default (...parent) => __DEV__
  ? (...args) => console.log(...parent, ...args)
  : () => {}
