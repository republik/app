import Config from 'react-native-config'

export const FRONTEND_BASE_URL = Config.FRONTEND_BASE_URL
export const FEED_PATH = `/feed`
export const LOGIN_PATH = `/anmelden`
export const OFFERS_PATH = '/angebote'
export const NOTIFICATIONS_PATH = 'mitteilung'
export const FEED_URL = `${FRONTEND_BASE_URL}${FEED_PATH}`
export const LOGIN_URL = `${FRONTEND_BASE_URL}${LOGIN_PATH}`
