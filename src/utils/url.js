import Config from 'react-native-config'
import { Platform } from 'react-native'
import { parse } from 'url'

export const parseURL = value => {
  const url = parse(value || '', true)

  return {
    url: url.href,
    protocol: url.protocol,
    host: url.hostname,
    path: url.pathname,
    params: url.query
  }
}

// localhost does not work on Android.
// https://stackoverflow.com/questions/4336394/webview-and-localhost
export const handleEnv = value => {
  if (Config.ENV === 'development' && value) {
    return Platform.select({
      ios: value,
      android: value.replace('localhost', '10.0.2.2')
    })
  }

  return value
}
