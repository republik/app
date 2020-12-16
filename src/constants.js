import { AsyncStorage } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { parse } from 'url'

import {
  FRONTEND_BASE_URL as env_FRONTEND_BASE_URL,
  API_URL as env_API_URL,
  API_WS_URL as env_API_WS_URL,
  OTA_BASE_URL as env_OTA_BASE_URL,
  API_AUTHORIZATION_HEADER as env_API_AUTHORIZATION_HEADER,
  CURTAIN_BACKDOOR_PATH as env_CURTAIN_BACKDOOR_PATH,
} from '@env'
import { handleEnv } from './utils/url'

// Base urls
export const API_URL = handleEnv(env_API_URL)
export const API_WS_URL = handleEnv(env_API_WS_URL)
export const FRONTEND_BASE_URL = handleEnv(env_FRONTEND_BASE_URL)
export const FRONTEND_HOST = parse(FRONTEND_BASE_URL).host
export const OTA_BASE_URL = handleEnv(env_OTA_BASE_URL)
export const API_AUTHORIZATION_HEADER = env_API_AUTHORIZATION_HEADER
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
export const CURTAIN_BACKDOOR_PATH = `/${env_CURTAIN_BACKDOOR_PATH}`

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

// Audio
export const AUDIO_PLAYER_HEIGHT = 68
export const ANIMATION_DURATION = 250
export const AUDIO_PLAYER_PROGRESS_HEIGHT = 5
export const AUDIO_PLAYER_MAX_WIDTH = 414
export const AUDIO_PLAYER_PADDING = 16
