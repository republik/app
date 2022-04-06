import React, { useMemo, useState, useRef } from 'react'
import { View, StyleSheet, Animated, PanResponder, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
  AUDIO_PLAYER_EXPANDED_PADDING_X,
  AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT,
} from '../../constants'
import TrackPlayer from 'react-native-track-player'
import { useColorContext } from '../../utils/colors'

const ProgressBar = ({
  expanded,
  playbackRate,
  position,
  duration,
  bufferedPosition,
  thumb,
}) => {
  const insets = useSafeAreaInsets()
  const [isPanning, setIsPanning] = useState(false)
  const [playerWidth, setPlayerWidth] = useState(0)
  const [panProgress, setPanProgress] = useState(0)
  const { colors } = useColorContext()
  const panScaleValue = useRef(new Animated.Value(1)).current

  const panResponder = useMemo(() => {
    const expandAnim = () => {
      Animated.timing(panScaleValue, {
        toValue: 2.5,
        easing: Easing.in(Easing.ease),
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start()
    }

    const collapseAnim = () => {
      Animated.timing(panScaleValue, {
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
        setPanProgress(
          expanded
            ? (gestureState.x0 -
                insets.left -
                AUDIO_PLAYER_EXPANDED_PADDING_X) /
                playerWidth
            : gestureState.x0 / playerWidth,
        )
        expandAnim()
      },
      onPanResponderMove: (evt, gestureState) => {
        setPanProgress(
          expanded
            ? (gestureState.moveX -
                insets.left -
                AUDIO_PLAYER_EXPANDED_PADDING_X) /
                playerWidth
            : gestureState.moveX / playerWidth,
        )
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsPanning(false)
        // seekTo does not work on iOS unless playing
        TrackPlayer.play()
        TrackPlayer.seekTo(panProgress * duration)
        TrackPlayer.setRate(playbackRate)
        collapseAnim()
      },
    })
  }, [
    panScaleValue,
    playerWidth,
    duration,
    panProgress,
    insets,
    expanded,
    playbackRate,
  ])

  const progress = isPanning ? panProgress * 100 : (position / duration) * 100
  const buffered = (bufferedPosition / duration) * 100

  return (
    <View
      style={{
        marginHorizontal: expanded ? AUDIO_PLAYER_EXPANDED_PADDING_X : 0,
        paddingTop: expanded ? 24 : 0,
        paddingBottom: expanded ? 24 + AUDIO_PLAYER_PROGRESS_HEIGHT : 0,
        height: AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT,
      }}
      {...panResponder.panHandlers}
      onLayout={e => setPlayerWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: colors.progress },
          !thumb && {
            transform: [
              { scaleY: panScaleValue },
              {
                translateY: panScaleValue.interpolate({
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
            { backgroundColor: colors.text, width: `${progress}%` },
          ]}
        />
        {thumb && (
          <Animated.View
            style={[
              styles.progressThumb,
              { backgroundColor: colors.text, left: `${progress}%` },
              {
                transform: [
                  {
                    scale: panScaleValue.interpolate({
                      inputRange: [1, 2.5],
                      outputRange: [1, 2],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  )
}

export default ProgressBar

const styles = StyleSheet.create({
  progressBar: {
    width: '100%',
    height: AUDIO_PLAYER_PROGRESS_HEIGHT,
  },
  progressThumb: {
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    position: 'absolute',
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
