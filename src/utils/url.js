import parse from 'url-parse'
import Config from 'react-native-config'
import { Platform } from 'react-native'

const parseParams = params => {
  if (!params || params === '') {
    return {}
  }

  return params.split('&').reduce((acc, param) => {
    const paramData = param.split('=')

    return {
      ...acc,
      [paramData[0]]: paramData[1]
    }
  }, {})
}

const normalize = url => url.replace('www.', '')

export const parseURL = value => {
  const match = parse(value)

  if (!match) {
    return {
      url: value,
      protocol: null,
      host: null,
      path: null,
      params: {
        toString: () => ''
      }
    }
  }

  const params = match.query.substring(1)

  return {
    url: normalize(match.href),
    protocol: match.protocol,
    host: normalize(match.hostname),
    path: match.pathname,
    params: {
      ...parseParams(params),
      toString: () => params
    }
  }
}

// localhost does not work on Android.
// https://stackoverflow.com/questions/4336394/webview-and-localhost
export const handleEnv = value => {
  if (Config.ENV === 'development') {
    return Platform.select({
      ios: value,
      android: value.replace('localhost', '10.0.2.2')
    })
  }

  return value
}
