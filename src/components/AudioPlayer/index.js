import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native'
import TrackPlayer, {
  useTrackPlayerProgress,
  usePlaybackState,
} from 'react-native-track-player'
import Icon from 'react-native-vector-icons/MaterialIcons'

import Logo from '../../assets/images/playlist-logo.png'
import {
  FRONTEND_BASE_URL,
  AUDIO_PLAYER_HEIGHT,
  ANIMATION_DURATION,
} from '../../constants'
import { useGlobalState } from '../../GlobalState'
import { usePrevious } from '../../utils/usePrevious'
// import ProgressBar from './ProgressBar'

const parseSeconds = (value) => {
  if (value === null || value === undefined) return ''
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value - minutes * 60)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const AudioPlayer = () => {
  const insets = useSafeAreaInsets()
  const progress = useTrackPlayerProgress()
  const playbackState = usePlaybackState()
  const { persistedState, setPersistedState, setGlobalState } = useGlobalState()
  const { audio } = persistedState
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Initializes the player
  useEffect(() => {
    setup()
  }, [])

  async function setup() {
    await TrackPlayer.setupPlayer({})
    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_STOP,
      ],
    })
  }

  // Handles changes in the audio persisted state, sliding the
  // player in when there is an audio object vs sliding it out
  // once the audio object is wiped from persistedState
  // also triggers playback when a new audio object is set to persistedState,
  // which happens via message API.

  useEffect(() => {
    if (audio == null) {
      slideIn()
      togglePlayback()
    } else {
      slideOut()
      togglePlayback()
    }
  }, [audio])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function togglePlayback() {
    if (audio == null) {
      return
    }
    const currentTrack = await TrackPlayer.getCurrentTrack()
    if (currentTrack == null) {
      await TrackPlayer.reset()
      await TrackPlayer.add({
        id: audio.mediaId,
        url: audio.url,
        title: audio.title,
        artist: 'Republik',
        artwork: Logo,
      })
      await TrackPlayer.play()
    } else {
      if (playbackState === TrackPlayer.STATE_PAUSED) {
        await TrackPlayer.play()
      } else {
        await TrackPlayer.pause()
      }
    }
  }

  // Animation definitions
  const slideIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start()
  }

  const slideOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: AUDIO_PLAYER_HEIGHT + insets.bottom,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, AUDIO_PLAYER_HEIGHT + insets.bottom],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.player}>
        <Icon
          name={
            playbackState == TrackPlayer.STATE_PAUSED ? 'play-arrow' : 'pause'
          }
          size={35}
          onPress={() => togglePlayback()}
        />
        <Icon name="fast-rewind" size={25} onPress={() => {}} />
        <View style={styles.content}>
          <TouchableOpacity>
            <Text numberOfLines={1} style={styles.title}>
              Autio Title
            </Text>
          </TouchableOpacity>
          <Text style={styles.time}>
            {parseSeconds(progress.position)} /{' '}
            {parseSeconds(progress.duration)}
          </Text>
        </View>
        <Icon
          name="close"
          size={35}
          onPress={() =>
            setPersistedState({
              audio: null,
            })
          }
        />
        <SafeAreaView edges={['right', 'bottom', 'left']} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  player: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginHorizontal: 15,
    maxWidth: 400,
    height: AUDIO_PLAYER_HEIGHT,
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
    fontSize: 14,
    fontFamily: 'GT America',
    fontVariant: ['tabular-nums'],
  },
})

export default AudioPlayer
