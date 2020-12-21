import React, { useEffect, useMemo, useState, useRef } from 'react'
import { View, StyleSheet, Animated, PanResponder, Easing } from 'react-native'
import debounce from 'lodash.debounce'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
  AUDIO_PLAYER_PADDING,
} from '../../constants'
import { useColorContext } from '../../utils/colors'

const ProgressBar = ({
  position,
  bufferedPosition,
  duration,
  audio,
  isPlaying,
  enableProgress,
  upsertCurrentMediaProgress,
  panProgress,
  onPanStart,
  onPanMove,
  onPanReleased,
}) => {
  const [isPanning, setIsPanning] = useState(false)
  const [playerWidth, setPlayerWidth] = useState(0)
  const { colors } = useColorContext()
  const scaleY = useRef(new Animated.Value(1)).current

  const upsertProgress = debounce(() => {
    upsertCurrentMediaProgress()
  }, 1000)

  const panResponder = useMemo(() => {
    const expandAnim = () => {
      Animated.timing(scaleY, {
        toValue: 2.5,
        easing: Easing.in(Easing.ease),
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start()
    }

    const collapseAnim = () => {
      Animated.timing(scaleY, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start()
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsPanning(true)
        onPanStart((gestureState.x0 - AUDIO_PLAYER_PADDING) / playerWidth)
        expandAnim()
      },
      onPanResponderMove: (evt, gestureState) => {
        onPanMove((gestureState.moveX - AUDIO_PLAYER_PADDING) / playerWidth)
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsPanning(false)
        onPanReleased()
        collapseAnim()
      },
    })
  }, [scaleY, onPanStart, playerWidth, onPanMove, onPanReleased])

  useEffect(() => {
    if (enableProgress && audio && isPlaying && position > 0) {
      if (audio.mediaId) {
        upsertProgress()
      } else {
        console.warn(`Audio element ${audio.id} has no mediaId`)
      }
    }
  }, [upsertProgress, audio, enableProgress, isPlaying, position])

  const progress = isPanning ? panProgress * 100 : (position / duration) * 100
  const buffered = (bufferedPosition / duration) * 100

  return (
    <View
      style={styles.progressBarContainer}
      {...panResponder.panHandlers}
      onLayout={(e) => setPlayerWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: colors.progress },
          {
            transform: [
              { scaleY },
              {
                translateY: scaleY.interpolate({
                  inputRange: [1, 2.5],
                  outputRange: [0, -AUDIO_PLAYER_PROGRESS_HEIGHT / 3],
                }),
              },
            ],
          },
        ]}>
        <View
          style={[
            styles.progressBuffer,
            {
              backgroundColor: colors.progressBuffer,
              width: `${buffered}%`,
            },
          ]}
        />
        <View
          style={[
            styles.progressPosition,
            { backgroundColor: colors.primary, width: `${progress}%` },
          ]}
        />
      </Animated.View>
    </View>
  )
}

export default ProgressBar

const styles = StyleSheet.create({
  progressBarContainer: {
    bottom: 0,
    width: '100%',
    position: 'absolute',
  },
  progressBar: {
    width: '100%',
    height: AUDIO_PLAYER_PROGRESS_HEIGHT,
  },
  progressPosition: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
  },
  progressBuffer: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
    backgroundColor: '#bebdcc',
  },
})
