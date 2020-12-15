import React, { useEffect } from 'react'
import {
  LayoutAnimation,
  Animated,
  StatusBar,
  Platform,
  UIManager,
} from 'react-native'
import {
  getStatusBarHeight,
  isIPhoneWithMonobrow,
} from 'react-native-status-bar-height'
import { useColorContext } from '../utils/colors'
import { useOrientation } from '../utils/useOrientation'
import { useGlobalState } from '../GlobalState'
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

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
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [isFullscreen])

  return (
    <Animated.View
      style={{
        height:
          orientation === 'landscape' ||
          (isFullscreen && !isIPhoneWithMonobrow())
            ? 0
            : statusBarHeight,
        backgroundColor,
      }}>
      <StatusBar
        animated
        translucent
        barStyle={barStyle}
        backgroundColor={backgroundColor}
        hidden={isFullscreen}
      />
    </Animated.View>
  )
}

export default CustomStatusBar
