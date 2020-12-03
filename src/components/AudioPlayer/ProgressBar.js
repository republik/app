import React, { useEffect, useMemo, useState, useRef } from 'react'
import { View, StyleSheet, Animated, PanResponder, Easing } from 'react-native'
import debounce from 'lodash.debounce'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
  AUDIO_PLAYER_PADDING,
} from '../../constants'

const ProgressBar = ({
  position,
  bufferedPosition,
  duration,
  audio,
  isPlaying,
  enableProgress,
  upsertCurrentMediaProgress,
  onProgressPanReleased,
}) => {
  const [isPanning, setIsPanning] = useState(false)
  const [panProgress, setPanProgress] = useState(0)
  const [playerWidth, setPlayerWidth] = useState(0)

  const scaleY = useRef(new Animated.Value(1)).current

  const upsertProgress = debounce(() => {
    upsertCurrentMediaProgress()
  }, 1000)

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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gestureState) => {
          setIsPanning(true)
          setPanProgress(gestureState.x0 - AUDIO_PLAYER_PADDING)
          expandAnim()
        },
        onPanResponderMove: (evt, gestureState) => {
          setPanProgress(gestureState.moveX - AUDIO_PLAYER_PADDING)
        },
        onPanResponderRelease: (evt, gestureState) => {
          setIsPanning(false)
          onProgressPanReleased((panProgress / playerWidth) * duration)
          collapseAnim()
        },
      }),
    [duration, playerWidth, panProgress],
  )

  useEffect(() => {
    if (enableProgress && audio && isPlaying && position > 0) {
      if (audio.mediaId) {
        upsertProgress()
      } else {
        console.warn(`Audio element ${audio.id} has no mediaId`)
      }
    }
  }, [upsertProgress, audio, enableProgress, isPlaying, position])

  const progress = isPanning
    ? (panProgress / playerWidth) * 100
    : (position / duration) * 100
  const buffered = (bufferedPosition / duration) * 100
  return (
    <View
      style={styles.progressBarContainer}
      {...panResponder.panHandlers}
      onLayout={(e) => setPlayerWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            transform: [
              {
                scaleY,
                translateY: scaleY.interpolate({
                  inputRange: [1, 2.5],
                  outputRange: [0, -AUDIO_PLAYER_PROGRESS_HEIGHT / 3],
                }),
              },
            ],
          },
        ]}>
        <View style={[styles.progressBuffer, { width: `${buffered}%` }]} />
        <View style={[styles.progressPosition, { width: `${progress}%` }]} />
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
    backgroundColor: '#e8e8ed',
    height: AUDIO_PLAYER_PROGRESS_HEIGHT,
  },
  progressPosition: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
    backgroundColor: '#3cad01',
  },
  progressBuffer: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
    backgroundColor: '#bebdcc',
  },
})
