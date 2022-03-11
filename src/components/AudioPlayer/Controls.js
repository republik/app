import React, { useRef, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { useColorContext } from '../../utils/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import TrackPlayer from 'react-native-track-player'
import { useGlobalState } from '../../GlobalState'
import { parseSeconds } from './index.js'
import { AUDIO_PLAYER_HEIGHT, ANIMATION_DURATION } from '../../constants'

const AnimatedIcon = Animated.createAnimatedComponent(Icon)

const Controls = ({
  audio,
  expanded,
  duration,
  position,
  isPlaying,
  onExpandToggle,
  onPlayBackRateSelectToggle,
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
    <View style={[styles.controls]}>
      <View style={[styles.column, { flex: 1 }]}>
        {expanded ? (
          <TouchableOpacity
            onPress={onPlayBackRateSelectToggle}
            style={styles.playbackRateButton}>
            <Text
              style={styles.plabackRateButtonText}>{`${playbackRate}x`}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={46}
              color={colors.text}
              onPress={() => {
                if (isPlaying) {
                  TrackPlayer.pause()
                } else {
                  TrackPlayer.play()
                }
              }}
            />
            <View style={styles.content}>
              <TouchableOpacity onPress={onTitlePress}>
                <Text
                  numberOfLines={1}
                  style={[styles.title, { color: colors.text }]}>
                  {audio && audio.title}
                </Text>
              </TouchableOpacity>
              {duration > 0 && (
                <Text style={[styles.time, { color: colors.textSoft }]}>
                  {parseSeconds(position)} / {parseSeconds(duration)}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
      <View style={styles.column}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  controls: {
    width: '100%',
    height: AUDIO_PLAYER_HEIGHT,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
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
