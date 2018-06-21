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

export const ENV = handleEnv(Config.ENV)
export const API_URL = handleEnv(Config.API_URL)
export const API_WS_URL = handleEnv(Config.API_WS_URL)
export const FRONTEND_BASE_URL = handleEnv(Config.FRONTEND_BASE_URL)
export const CURTAIN_BACKDOOR_PATH = `/${Config.CURTAIN_BACKDOOR_PATH}`
export const HOME_PATH = `/`
export const FEED_PATH = `/feed`
export const ACCOUNT_PATH = '/konto'
export const LOGIN_PATH = `/anmelden`
export const OFFERS_PATH = '/angebote'
export const FORMATS_PATH = '/rubriken'
export const COMMUNITY_PATH = '/community'
export const EVENTS_PATH = '/veranstaltungen'
export const DISCUSSIONS_PATH = '/diskussion'
export const NOTIFICATIONS_PATH = '/mitteilung'
export const HOME_URL = `${FRONTEND_BASE_URL}${HOME_PATH}`
export const FEED_URL = `${FRONTEND_BASE_URL}${FEED_PATH}`
export const LOGIN_URL = `${FRONTEND_BASE_URL}${LOGIN_PATH}`
export const EVENTS_URL = `${FRONTEND_BASE_URL}${EVENTS_PATH}`
export const ACCOUNT_URL = `${FRONTEND_BASE_URL}${ACCOUNT_PATH}`
export const FORMATS_URL = `${FRONTEND_BASE_URL}${FORMATS_PATH}`
export const COMMUNITY_URL = `${FRONTEND_BASE_URL}${COMMUNITY_PATH}`
export const DISCUSSIONS_URL = `${FRONTEND_BASE_URL}${DISCUSSIONS_PATH}`
