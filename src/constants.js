import { AsyncStorage } from 'react-native'
import Config from 'react-native-config'
import { handleEnv } from './utils/url'
import { parse } from 'url'
import DeviceInfo from 'react-native-device-info'

// Base urls
export const ENV = Config.ENV
export const API_URL = handleEnv(Config.API_URL)
export const API_WS_URL = handleEnv(Config.API_WS_URL)
export const FRONTEND_BASE_URL = handleEnv(Config.FRONTEND_BASE_URL)
export const FRONTEND_HOST = parse(FRONTEND_BASE_URL).host
export const OTA_BASE_URL = handleEnv(Config.OTA_BASE_URL)
export const API_AUTHORIZATION_HEADER = Config.API_AUTHORIZATION_HEADER

// App paths
export const HOME_PATH = `/`
export const FEED_PATH = `/feed`
export const SEARCH_PATH = '/suche'
export const ACCOUNT_PATH = '/konto'
export const SIGN_IN_PATH = `/anmelden`
export const OFFERS_PATH = '/angebote'
export const FORMATS_PATH = '/rubriken'
export const COMMUNITY_PATH = '/community'
export const EVENTS_PATH = '/veranstaltungen'
export const DISCUSSIONS_PATH = '/diskussion'
export const NOTIFICATIONS_PATH = '/mitteilung'
export const CURTAIN_BACKDOOR_PATH = `/${Config.CURTAIN_BACKDOOR_PATH}`

// App urls
export const HOME_URL = `${FRONTEND_BASE_URL}${HOME_PATH}`
export const FEED_URL = `${FRONTEND_BASE_URL}${FEED_PATH}`
export const SIGN_IN_URL = `${FRONTEND_BASE_URL}${SIGN_IN_PATH}`
export const EVENTS_URL = `${FRONTEND_BASE_URL}${EVENTS_PATH}`
export const SEARCH_URL = `${FRONTEND_BASE_URL}${SEARCH_PATH}`
export const ACCOUNT_URL = `${FRONTEND_BASE_URL}${ACCOUNT_PATH}`
export const FORMATS_URL = `${FRONTEND_BASE_URL}${FORMATS_PATH}`
export const COMMUNITY_URL = `${FRONTEND_BASE_URL}${COMMUNITY_PATH}`
export const DISCUSSIONS_URL = `${FRONTEND_BASE_URL}${DISCUSSIONS_PATH}`

// Misc
export const APP_VERSION = DeviceInfo.getVersion()
const nativeUserAgent = DeviceInfo.getUserAgent()
export let USER_AGENT = `${nativeUserAgent} RepublikApp/${APP_VERSION}`

// Append bundle version to user-agent header
AsyncStorage.getItem('BUNDLE_VERSION_KEY').then(BUNDLE_VERSION => {
  USER_AGENT += BUNDLE_VERSION ? '/' + BUNDLE_VERSION : ''
})
