import React, { useEffect, useRef } from 'react'
import { Animated, StatusBar, Easing } from 'react-native'
import {
  getStatusBarHeight,
  isIPhoneWithMonobrow,
} from 'react-native-status-bar-height'
import changeNavigationBarColor from 'react-native-navigation-bar-color'

import { useColorContext } from '../utils/colors'
import { useOrientation } from '../utils/useOrientation'
import { useGlobalState } from '../GlobalState'
import { ANIMATION_DURATION } from '../constants'

const CustomStatusBar = () => {
  const { colors, colorSchemeKey } = useColorContext()
  const statusBarHeight = getStatusBarHeight()
  const orientation = useOrientation()
  const {
    persistedState: { isFullscreen },
  } = useGlobalState()
  const backgroundColor = isFullscreen
    ? colors.fullScreenStatusBar
    : colors.default
  const barStyle = colorSchemeKey === 'dark' ? 'light-content' : 'dark-content'
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    changeNavigationBarColor(backgroundColor)
  }, [backgroundColor])

  useEffect(() => {
    const slideIn = () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start()
    }
    const slideOut = () => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start()
    }
    if (isFullscreen) {
      slideOut()
      return
    }
    slideIn()
  }, [isFullscreen, slideAnim])

  const animationStatusBarHeight =
    orientation === 'landscape' || !isIPhoneWithMonobrow() ? 0 : statusBarHeight

  return (
    <Animated.View
      style={{
        height: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [
            orientation === 'landscape' ? 0 : statusBarHeight,
            animationStatusBarHeight,
          ],
        }),
        backgroundColor,
      }}>
      <StatusBar
        animated
        translucent
        barStyle={barStyle}
        // workaround: needs to be transparent on Android, else it overlaps because it's too big
        backgroundColor={'rgba(0,0,0,0)'}
        hidden={isFullscreen}
      />
    </Animated.View>
  )
}

export default CustomStatusBar
