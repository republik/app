import { ENV } from '@env'
import { Platform } from 'react-native'

// localhost does not work on Android.
// https://stackoverflow.com/questions/4336394/webview-and-localhost
export const handleEnv = (value) => {
  if (ENV === 'development' && value) {
    return Platform.select({
      ios: value,
      android: value.replace('localhost', '10.0.2.2'),
    })
  }

  return value
}
