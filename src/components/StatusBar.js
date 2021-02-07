import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StatusBar, Easing, Platform } from 'react-native'
import {
  getStatusBarHeight,
  isIPhoneWithMonobrow,
} from 'react-native-status-bar-height'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { getModel } from 'react-native-device-info'

import { useColorContext } from '../utils/colors'
import { useOrientation } from '../utils/useOrientation'
import { useGlobalState } from '../GlobalState'
import { ANIMATION_DURATION } from '../constants'

const CustomStatusBar = () => {
  const { colors, colorSchemeKey } = useColorContext()
  const statusBarHeight = getStatusBarHeight()
  const orientation = useOrientation()
  const {
    globalState: { isFullscreen },
  } = useGlobalState()
  const backgroundColor = isFullscreen
    ? colors.fullScreenStatusBar
    : colors.default
  const barStyle = colorSchemeKey === 'dark' ? 'light-content' : 'dark-content'
  const slideAnim = useRef(new Animated.Value(0)).current

  const model = useMemo(() => getModel(), [])

  useEffect(() => {
    if (Platform.OS === 'ios') {
      // workaround odd issue where status bar style change does not stick after OS dark mode switch
      // to reproduce:
      // - open app in iOS simulator, set «Nachtmodus» to «Automatisch»
      // - toggle dark mode via cmd + shift + a
      // - when going dark: without this fix the bar style first changes to light as desiered but goes dark again after ~500ms
      // - the 1500ms is necessary for hot reloading, where it also always goes dark when in auto dark node
      const timeoutId = setTimeout(() => {
        StatusBar.setBarStyle(barStyle)
      }, 500)
      const timeout2Id = setTimeout(() => {
        StatusBar.setBarStyle(barStyle)
      }, 1500)
      return () => {
        clearTimeout(timeoutId)
        clearTimeout(timeout2Id)
      }
    }
  }, [barStyle])
  useEffect(() => {
    changeNavigationBarColor(backgroundColor, backgroundColor === '#FFFFFF')
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

  const isAlwaysHidden = orientation === 'landscape' && !model.match('iPad')
  const animationStatusBarHeight =
    isAlwaysHidden || !isIPhoneWithMonobrow() ? 0 : statusBarHeight

  return (
    <Animated.View
      style={{
        height: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [
            isAlwaysHidden ? 0 : statusBarHeight,
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
        backgroundColor="rgba(0,0,0,0)"
        hidden={isFullscreen || isAlwaysHidden}
      />
    </Animated.View>
  )
}

export default CustomStatusBar
