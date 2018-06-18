import Config from 'react-native-config'

export const API_URL = Config.API_URL
export const API_WS_URL = Config.API_WS_URL
export const FRONTEND_BASE_URL = Config.FRONTEND_BASE_URL
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
