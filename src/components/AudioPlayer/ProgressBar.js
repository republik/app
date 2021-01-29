import React, { useEffect, useMemo, useState, useRef } from 'react'
import { View, StyleSheet, Animated, PanResponder, Easing } from 'react-native'
import debounce from 'lodash.debounce'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
} from '../../constants'
import TrackPlayer, { useTrackPlayerProgress, usePlaybackState } from 'react-native-track-player'
import { useColorContext } from '../../utils/colors'
import { useGlobalState } from '../../GlobalState'

const ProgressBar = ({ audio }) => {
  const [isPanning, setIsPanning] = useState(false)
  const [playerWidth, setPlayerWidth] = useState(0)
  const [panProgress, setPanProgress] = useState(0)
  const { colors } = useColorContext()
  const { position, duration, bufferedPosition } = useTrackPlayerProgress(100)
  const playbackState = usePlaybackState()
  const { dispatch } = useGlobalState()
  const scaleY = useRef(new Animated.Value(1)).current

  const isPlaying = playbackState === TrackPlayer.STATE_PLAYING

  const upsertCurrentMediaProgress = useMemo(() => {
    return debounce((audio, position) => {
      if (audio) {
        dispatch({
          type: 'postMessage',
          content: {
            type: 'onAppMediaProgressUpdate',
            mediaId: audio.mediaId,
            currentTime: position,
          },
        })
      }
    }, 1000)
  }, [dispatch])

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
        setPanProgress(gestureState.x0 / playerWidth)
        expandAnim()
      },
      onPanResponderMove: (evt, gestureState) => {
        setPanProgress(gestureState.moveX / playerWidth)
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsPanning(false)
        TrackPlayer.seekTo(panProgress * duration)
        collapseAnim()
      },
    })
  }, [scaleY, playerWidth, duration, panProgress])

  useEffect(() => {
    if (audio && isPlaying && position > 0) {
      if (audio.mediaId) {
        upsertCurrentMediaProgress(audio, position)
      } else {
        console.warn(`Audio element ${audio.id} has no mediaId`)
      }
    }
  }, [upsertCurrentMediaProgress, audio, isPlaying, position])

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
    top: 0,
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
