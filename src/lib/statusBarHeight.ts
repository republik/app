import { Dimensions, Platform, StatusBar } from 'react-native'

const STATUSBAR_DEFAULT_HEIGHT = 20

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get('window')

let statusBarHeight = STATUSBAR_DEFAULT_HEIGHT
let isIPhoneWithMonobrow_v = false
let isIPhoneWithDynamicIsland_v = false

if (Platform.OS === 'ios' && !Platform.isPad) {
  if (
    (W_WIDTH === 375 && W_HEIGHT === 812) ||
    (W_WIDTH === 414 && W_HEIGHT === 896)
  ) {
    isIPhoneWithMonobrow_v = true
    statusBarHeight = 44
  } else if (
    (W_WIDTH === 390 && W_HEIGHT === 844) ||
    (W_WIDTH === 428 && W_HEIGHT === 926)
  ) {
    isIPhoneWithMonobrow_v = true
    statusBarHeight = 47
  } else if (
    (W_WIDTH === 393 && W_HEIGHT === 932) ||
    (W_WIDTH === 393 && W_HEIGHT === 852)
  ) {
    isIPhoneWithDynamicIsland_v = true
    statusBarHeight = 54
  }
}

export const isIPhoneWithMonobrow = () => isIPhoneWithMonobrow_v
export const isIPhoneWithDynamicIsland = () => isIPhoneWithDynamicIsland_v

export function getStatusBarHeight() {
  return Platform.select({
    ios: statusBarHeight,
    android: StatusBar.currentHeight,
    default: 0,
  })
}
