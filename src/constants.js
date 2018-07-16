import { Settings } from 'react-native'
import Config from 'react-native-config'
import { handleEnv } from './utils/url'

// Base urls
export const ENV = Settings.get('environment_preference') || Config.ENV
export const API_URL = handleEnv(Settings.get('graphql_url') || Config.API_URL)
export const API_WS_URL = handleEnv(Settings.get('ws_url') || Config.API_WS_URL)
export const FRONTEND_BASE_URL = handleEnv(Settings.get('application_url') || Config.FRONTEND_BASE_URL)
export const ASSETS_SERVER_BASE_URL = handleEnv(Settings.get('assets_url') || Config.ASSETS_SERVER_BASE_URL)

// App paths
export const HOME_PATH = `/`
export const FEED_PATH = `/feed`
export const SEARCH_PATH = '/suche'
export const ACCOUNT_PATH = '/konto'
export const LOGIN_PATH = `/anmelden`
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
export const LOGIN_URL = `${FRONTEND_BASE_URL}${LOGIN_PATH}`
export const EVENTS_URL = `${FRONTEND_BASE_URL}${EVENTS_PATH}`
export const SEARCH_URL = `${FRONTEND_BASE_URL}${SEARCH_PATH}`
export const ACCOUNT_URL = `${FRONTEND_BASE_URL}${ACCOUNT_PATH}`
export const FORMATS_URL = `${FRONTEND_BASE_URL}${FORMATS_PATH}`
export const COMMUNITY_URL = `${FRONTEND_BASE_URL}${COMMUNITY_PATH}`
export const DISCUSSIONS_URL = `${FRONTEND_BASE_URL}${DISCUSSIONS_PATH}`

// Misc
export const USER_AGENT = 'RepublikApp'
