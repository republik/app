import React, { useEffect, useRef } from 'react'

import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native'
import debounce from 'lodash.debounce'
import { ANIMATION_DURATION } from '../../constants'

const ProgressBar = ({
  position,
  bufferedPosition,
  duration,
  audio,
  isPlaying,
  enableProgress,
  upsertCurrentMediaProgress,
  onPositionStart,
  onPositionChange,
  onPositionReleased,
}) => {
  const upsertProgress = debounce((mediaId, secs) => {
    upsertCurrentMediaProgress({ variables: { mediaId, secs } })
  }, 1000)

  const height = new Animated.Value(5)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { width } = Dimensions.get('window')
        onPositionStart((gestureState.x0 / width) * duration)
        Animated.timing(height, {
          toValue: 15,
          duration: ANIMATION_DURATION,
        }).start()
      },
      onPanResponderMove: (evt, gestureState) => {
        const { width } = Dimensions.get('window')
        onPositionChange((gestureState.moveX / width) * duration)
      },
      onPanResponderRelease: (evt, gestureState) => {
        onPositionReleased()
        Animated.timing(height, {
          toValue: 5,
          duration: ANIMATION_DURATION,
        }).start()
      },
    }),
  ).current

  useEffect(() => {
    if (enableProgress && audio && isPlaying && position > 0) {
      if (audio.mediaId) {
        upsertProgress(audio.mediaId, position)
      } else {
        console.warn(`Audio element ${audio.id} has no mediaId`)
      }
    }
  }, [upsertProgress, audio, enableProgress, isPlaying, position])

  const progress = (position / duration) * 100
  const buffered = (bufferedPosition / duration) * 100
  return (
    <View style={styles.progressBarContainer} {...panResponder.panHandlers}>
      <Animated.View style={[styles.progressBar, { height: this.height }]}>
        <View style={[styles.progressBuffer, { width: `${buffered}%` }]} />
        <View style={[styles.progressPosition, { width: `${progress}%` }]} />
      </Animated.View>
    </View>
  )
}

export default ProgressBar

const styles = StyleSheet.create({
  progressBarContainer: {
    top: 0,
    height: 18,
    width: '100%',
    position: 'absolute',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#e8e8ed',
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
