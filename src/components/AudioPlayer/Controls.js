import React, { useRef, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { useColorContext } from '../../utils/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import TrackPlayer from 'react-native-track-player'
import { useGlobalState } from '../../GlobalState'
import { parseSeconds } from './index.js'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
} from '../../constants'

const AnimatedIcon = Animated.createAnimatedComponent(Icon)

const Controls = ({
  audio,
  expanded,
  duration,
  position,
  isPlaying,
  onExpandToggle,
  playbackRate,
  onTitlePress,
}) => {
  const { setPersistedState } = useGlobalState()
  const { colors } = useColorContext()
  const rotateAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const rotateOpen = () => {
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start()
    }

    const rotateClosed = () => {
      Animated.timing(rotateAnimation, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start()
    }
    if (expanded) {
      rotateOpen()
    } else {
      rotateClosed()
    }
    return () => {}
  }, [expanded, rotateAnimation])

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <SafeAreaView
      edges={['right', 'left']}
      style={[
        styles.controls,
        {
          marginTop: expanded
            ? 2 * AUDIO_PLAYER_PROGRESS_HEIGHT
            : AUDIO_PLAYER_PROGRESS_HEIGHT,
        },
      ]}>
      <View style={[styles.column, { flex: 1 }]}>
        {!expanded && (
          <>
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              style={{ width: 46, paddingLeft: isPlaying ? 4 : 0 }}
              size={46}
              color={colors.text}
              onPress={() => {
                if (isPlaying) {
                  TrackPlayer.pause()
                } else {
                  if (audio.currentTime >= duration - 5) {
                    TrackPlayer.play()
                    TrackPlayer.seekTo(0)
                  }
                  TrackPlayer.play()
                }
              }}
            />
            <View style={styles.textContainer}>
              <TouchableOpacity onPress={onTitlePress}>
                <Text
                  numberOfLines={1}
                  style={[styles.title, { color: colors.text }]}>
                  {audio && audio.title}
                </Text>
              </TouchableOpacity>
              {duration > 0 && (
                <Text style={[styles.time, { color: colors.textSoft }]}>
                  {parseSeconds(position / playbackRate)} /{' '}
                  {parseSeconds(duration / playbackRate)}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
      <View style={[styles.column, { paddingRight: 8 }]}>
        <AnimatedIcon
          name={'expand-less'}
          size={40}
          color={colors.text}
          onPress={onExpandToggle}
          style={{ marginHorizontal: 12, transform: [{ rotate: rotate }] }}
        />
        <Icon
          name="close"
          size={35}
          color={colors.text}
          onPress={() =>
            setPersistedState({
              audio: null,
            })
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  controls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: AUDIO_PLAYER_PROGRESS_HEIGHT,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'GT America',
  },
  time: {
    fontSize: 16,
    fontFamily: 'GT America',
    fontVariant: ['tabular-nums'],
  },
  playbackRateButton: {
    paddingHorizontal: 8,
  },
  plabackRateButtonText: {
    fontSize: 22,
    fontFamily: 'GT America',
    fontWeight: '600',
  },
})

export default Controls
