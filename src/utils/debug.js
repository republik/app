import Config from 'react-native-config'

export default (...parent) => Config.ENV === 'development'
  ? (...args) => console.log(...parent, ...args)
  : () => {}
