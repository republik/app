import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
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

  useEffect(() => {
    togglePlayback()
  }, [audio])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function togglePlayback() {
    if (!audio) {
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

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: 0, height: AUDIO_PLAYER_HEIGHT + insets.bottom },
      ]}>
      <View style={styles.player}>
        <Icon
          name={
            playbackState == TrackPlayer.STATE_PAUSED ? 'play-arrow' : 'pause'
          }
          style={{ marginLeft: 10 }}
          size={35}
          onPress={() => togglePlayback()}
        />
        <Icon
          name="fast-rewind"
          style={{ marginLeft: 5 }}
          size={25}
          onPress={() => {}}
        />
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
          style={{ marginRight: 10 }}
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
    backgroundColor: '#ffffff',
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
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
