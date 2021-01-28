import React, { useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import TrackPlayer, {
  usePlaybackState,
  useTrackPlayerProgress,
} from 'react-native-track-player'

import Logo from '../../assets/images/playlist-logo.png'
import { AUDIO_PLAYER_HEIGHT, ANIMATION_DURATION } from '../../constants'
import { useGlobalState } from '../../GlobalState'
import { useColorContext } from '../../utils/colors'
import ProgressBar from './ProgressBar'
import Controls from './Controls'

const AudioPlayer = () => {
  const insets = useSafeAreaInsets()
  const playbackState = usePlaybackState()
  const { persistedState, setPersistedState, dispatch } = useGlobalState()
  const { audio, currentMediaTime } = persistedState
  const slideAnim = useRef(new Animated.Value(0)).current
  const { colors } = useColorContext()
  const { position } = useTrackPlayerProgress()

  // Initializes the player
  useEffect(() => {
    setup()
  }, [])

  async function setup() {
    await TrackPlayer.setupPlayer({})
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
      togglePlayback({ init: true })
    } else {
      slideOut()
      togglePlayback()
    }
  }, [audio, slideAnim, togglePlayback, setPersistedState, dispatch])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const togglePlayback = async ({ init } = {}) => {
    if (!audio) {
      await TrackPlayer.pause()
      return
    }
    const currentTrack = await TrackPlayer.getCurrentTrack()

    // check if there's already a track loaded in the player
    if (currentTrack === null) {
      // if not, add the audio object provided and
      await TrackPlayer.reset()
      await TrackPlayer.add({
        id: audio.mediaId,
        url: audio.url,
        title: audio.title,
        artist: 'Republik',
        artwork: Logo,
      })
      // if no current time, just play
      await TrackPlayer.play()
    } else {
      // if there's already a current track check if a the audio file provided is a new track
      if (currentTrack !== audio.mediaId) {
        // if so, reset the player, add new track and play
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
        // if it's the same audio, check if the player is paused
        if (playbackState === TrackPlayer.STATE_PAUSED) {
          // if so, start playback
          await TrackPlayer.play()
        } else {
          // else pause the player
          await TrackPlayer.pause()
        }
      }
    }
    if (init && currentMediaTime) {
      await TrackPlayer.seekTo(currentMediaTime)
    }
  }

  const seekTo = async (sec) => {
    await TrackPlayer.seekTo(sec)
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
          <ProgressBar
            audio={audio}
            enableProgress={true}
            isPlaying={playbackState === TrackPlayer.STATE_PLAYING}
            seekTo={(position) => seekTo(position)}
          />
          <Controls
            seekTo={(position) => seekTo(position)}
            audio={audio}
            togglePlayback={() => togglePlayback()}
            paused={TrackPlayer.STATE_PAUSED}
          />
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
