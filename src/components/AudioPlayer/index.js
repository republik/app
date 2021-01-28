import React, { useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native'
import TrackPlayer from 'react-native-track-player'

import Logo from '../../assets/images/playlist-logo.png'
import { AUDIO_PLAYER_HEIGHT, ANIMATION_DURATION } from '../../constants'
import { useGlobalState } from '../../GlobalState'
import { useColorContext } from '../../utils/colors'
import ProgressBar from './ProgressBar'
import Controls from './Controls'

async function setup() {
  await TrackPlayer.setupPlayer({
    backBuffer: 15,
  })
  await TrackPlayer.updateOptions({
    stopWithApp: true,
    jumpInterval: 15,
    capabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_JUMP_FORWARD,
      TrackPlayer.CAPABILITY_JUMP_BACKWARD,
      TrackPlayer.CAPABILITY_SEEK_TO,
    ],
  })
}

const AudioPlayer = () => {
  const insets = useSafeAreaInsets()
  const {
    persistedState,
    setPersistedState,
    dispatch,
    globalState,
    setGlobalState,
  } = useGlobalState()
  const { audio } = persistedState
  const slideAnim = useRef(new Animated.Value(0)).current
  const { colors } = useColorContext()

  // Initializes the player
  useEffect(() => {
    setup()
  }, [])

  // Handles changes in the audio persisted state, sliding the
  // player in when there is an audio object vs sliding it out
  // once the audio object is wiped from persistedState
  // also triggers playback when a new audio object is set to persistedState,
  // which happens via message API.
  useEffect(() => {
    const slideIn = () => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start()
    }
    const slideOut = () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start()
    }
    if (audio) {
      slideIn()
      loadAudio()
    } else {
      slideOut()
      loadAudio()
    }
  }, [audio, slideAnim, loadAudio, setPersistedState, dispatch])

  const loadAudio = async () => {
    if (!audio) {
      await TrackPlayer.reset()
      return
    }
    const currentTrack = await TrackPlayer.getCurrentTrack()
    if (currentTrack === null || currentTrack !== audio.mediaId) {
      await TrackPlayer.reset()
      await TrackPlayer.add({
        id: audio.mediaId,
        url: audio.url,
        title: audio.title,
        artist: 'Republik',
        artwork: Logo,
      })
    }
    if (globalState.autoPlayAudio) {
      if (audio.currentTime && Platform.OS === 'ios') {
        TrackPlayer.setVolume(0)
      }
      await TrackPlayer.play()
      setGlobalState({ autoPlayAudio: false })
      if (audio.currentTime) {
        if (Platform.OS === 'ios') {
          // seekTo does not work on iOS until the player has started playing
          // we workaround around this with a setTimeout:
          // https://github.com/react-native-kit/react-native-track-player/issues/387#issuecomment-709433886
          setTimeout(() => {
            TrackPlayer.seekTo(audio.currentTime)
          }, 1)
          setTimeout(() => {
            TrackPlayer.seekTo(audio.currentTime)
          }, 500)
          setTimeout(() => {
            TrackPlayer.seekTo(audio.currentTime)
            TrackPlayer.setVolume(1)
          }, 1000)
        } else {
          TrackPlayer.seekTo(audio.currentTime)
        }
      }
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.overlay,
          height: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, AUDIO_PLAYER_HEIGHT + insets.bottom],
          }),
        },
      ]}>
      <SafeAreaView edges={['right', 'left']}>
        <View style={[styles.player]}>
          <ProgressBar audio={audio} />
          <Controls audio={audio} />
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 7,
  },
  player: {
    justifyContent: 'center',
    flexDirection: 'column',
    height: AUDIO_PLAYER_HEIGHT,
  },
})

export default AudioPlayer
