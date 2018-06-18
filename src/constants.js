import { Platform } from 'react-native'
import Config from 'react-native-config'

// localhost does not work on Android.
// https://stackoverflow.com/questions/4336394/webview-and-localhost
const handleEnv = value => {
  if (Config.ENV === 'development') {
    return Platform.select({
      ios: value,
      android: value.replace('localhost', '10.0.2.2')
    })
  }

  return value
}

export const API_URL = handleEnv(Config.API_URL)
export const API_WS_URL = handleEnv(Config.API_WS_URL)
export const FRONTEND_BASE_URL = handleEnv(Config.FRONTEND_BASE_URL)
export const CURTAIN_BACKDOOR_PATH = `/${Config.CURTAIN_BACKDOOR_PATH}`
export const HOME_PATH = `/`
export const FEED_PATH = `/feed`
export const LOGIN_PATH = `/anmelden`
export const OFFERS_PATH = '/angebote'
export const DISCUSSIONS_PATH = '/diskussion'
export const NOTIFICATIONS_PATH = '/mitteilung'
export const HOME_URL = `${FRONTEND_BASE_URL}${HOME_PATH}`
export const FEED_URL = `${FRONTEND_BASE_URL}${FEED_PATH}`
export const LOGIN_URL = `${FRONTEND_BASE_URL}${LOGIN_PATH}`
export const DISCUSSIONS_URL = `${FRONTEND_BASE_URL}${DISCUSSIONS_PATH}`
