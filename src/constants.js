import DeviceInfo from 'react-native-device-info'
import { parse, format } from 'url'
import Config from 'react-native-config'
import { Platform } from 'react-native'

// support Android Emulator
// https://stackoverflow.com/questions/4336394/webview-and-localhost
const rewriteHost = value => {
  if (Config.ENV === 'development' && value) {
    return Platform.select({
      ios: value,
      android: value.replace('localhost', '10.0.2.2'),
    })
  }

  return value
}

export const devLog =
  Config.ENV === 'development' ? console.log.bind(console) : () => {}

// Base urls
export const FRONTEND_BASE_URL = rewriteHost(Config.FRONTEND_BASE_URL)
export const frontendBaseUrl = parse(FRONTEND_BASE_URL)
export const rewriteBaseUrl = url => {
  const originUrl = parse(url)
  originUrl.host = frontendBaseUrl.host
  originUrl.protocol = frontendBaseUrl.protocol
  originUrl.port = frontendBaseUrl.port
  return format(originUrl)
}

// App paths
export const HOME_PATH = '/'
export const CURTAIN_BACKDOOR_PATH = Config.CURTAIN_BACKDOOR_PATH

// App urls
export const HOME_URL = `${FRONTEND_BASE_URL}${HOME_PATH}`

// Misc
export const APP_VERSION = DeviceInfo.getVersion()

// Audio
export const AUDIO_PLAYER_HEIGHT = 68
export const ANIMATION_DURATION = 150
export const AUDIO_PLAYER_PROGRESS_HEIGHT = 4
export const AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT = 10
export const AUDIO_PLAYER_EXPANDED_PADDING_X = 16
