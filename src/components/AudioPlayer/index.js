import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native'
import TrackPlayer, {
  useTrackPlayerProgress,
  usePlaybackState,
} from 'react-native-track-player'
import throttle from 'lodash/throttle'

import Logo from '../../assets/images/playlist-logo.png'
import {
  ANIMATION_DURATION,
  AUDIO_PLAYER_HEIGHT,
  FRONTEND_BASE_URL,
  AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT,
} from '../../constants'
import { useGlobalState } from '../../GlobalState'
import { useColorContext } from '../../utils/colors'
import ProgressBar from './ProgressBar'
import Controls from './Controls'
import ExpandedControls from './ExpandedControls'

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

export const parseSeconds = value => {
  if (value === null || value === undefined) {
    return ''
  }
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value - minutes * 60)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
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
  const { audio, playbackRate = 1 } = persistedState
  const { autoPlayAudio } = globalState
  const slideAnimatedValue = useRef(new Animated.Value(0)).current
  const opacityAnimatedValue = useRef(new Animated.Value(0)).current
  const { colors } = useColorContext()
  const [expanded, setExpanded] = useState(false)
  const { position, duration, bufferedPosition } = useTrackPlayerProgress(500)
  const playbackState = usePlaybackState()

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
      Animated.sequence([
        Animated.timing(opacityAnimatedValue, {
          toValue: 1,
          duration: 5,
          delay: 20,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnimatedValue, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start()
    }
    const slideOut = () => {
      Animated.sequence([
        Animated.timing(slideAnimatedValue, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnimatedValue, {
          toValue: 0,
          duration: 5,
          useNativeDriver: false,
        }),
      ]).start()
    }

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
        TrackPlayer.setRate(playbackRate)
        if (audio.currentTime) {
          // restart the track at beginning if it was finished in previous session and is initiated again.
          const seekToTime =
            audio.currentTime >= duration - 5 ? 0 : audio.currentTime
          TrackPlayer.seekTo(seekToTime)
          TrackPlayer.setRate(playbackRate)
          if (Platform.OS === 'ios') {
            TrackPlayer.setVolume(0)
            await TrackPlayer.play()
            // seekTo does not work on iOS until the player has started playing
            // we workaround around this with a setTimeout:
            // https://github.com/react-native-kit/react-native-track-player/issues/387#issuecomment-709433886
            setTimeout(() => {
              TrackPlayer.seekTo(seekToTime)
            }, 1)
            setTimeout(() => {
              TrackPlayer.seekTo(seekToTime)
            }, 500)
            setTimeout(() => {
              TrackPlayer.seekTo(seekToTime)
              TrackPlayer.setRate(playbackRate)
              if (!autoPlayAudio) {
                TrackPlayer.pause()
              }
              TrackPlayer.setVolume(1)
            }, 1000)
          }
        }
      }
      if (autoPlayAudio) {
        await TrackPlayer.play()
        setGlobalState({ autoPlayAudio: false })
      }
    }

    if (audio) {
      slideIn()
      loadAudio()
    } else {
      slideOut()
      setExpanded(false)
      loadAudio()
    }
  }, [
    audio,
    autoPlayAudio,
    slideAnimatedValue,
    opacityAnimatedValue,
    setGlobalState,
    setPersistedState,
    dispatch,
    duration,
  ])
  const upsertCurrentMediaProgress = useMemo(() => {
    return throttle(
      (currentAudio, currentTime) => {
        if (currentAudio) {
          dispatch({
            type: 'postMessage',
            content: {
              type: 'onAppMediaProgressUpdate',
              mediaId: currentAudio.mediaId,
              currentTime,
            },
          })
          setPersistedState({
            audio: {
              ...currentAudio,
              currentTime,
            },
          })
        }
      },
      5000,
      { trailing: true },
    )
  }, [dispatch, setPersistedState])

  useEffect(() => {
    if (audio && isPlaying && position > 0) {
      if (audio.mediaId) {
        upsertCurrentMediaProgress(audio, position)
      } else {
        console.warn(`Audio element ${audio.id} has no mediaId`)
      }
    } else if (!audio) {
      // prevent call to rewrite audio to persited state with current position
      upsertCurrentMediaProgress.cancel()
    }
  }, [upsertCurrentMediaProgress, audio, isPlaying, position])

  useEffect(() => {
    return () => {
      // stop sending when app is quite
      upsertCurrentMediaProgress.cancel()
    }
  }, [upsertCurrentMediaProgress])

  const onTitlePress = () => {
    if (audio && audio.sourcePath) {
      setGlobalState({
        pendingUrl: `${FRONTEND_BASE_URL}${audio.sourcePath}`,
      })
    }
  }

  const isPlaying = playbackState === TrackPlayer.STATE_PLAYING

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.overlay,
            opacity: opacityAnimatedValue,
            height: slideAnimatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [
                0,
                AUDIO_PLAYER_HEIGHT +
                  AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT +
                  insets.bottom,
              ],
            }),
          },
        ]}>
        <View
          style={{
            height:
              AUDIO_PLAYER_HEIGHT +
              AUDIO_PLAYER_PROGRESS_HITZONE_HEIGHT +
              insets.bottom,
            backgroundColor: colors.overlay,
          }}>
          {!expanded && (
            <ProgressBar
              duration={duration}
              position={position}
              bufferedPosition={bufferedPosition}
              audio={audio}
              playbackRate={playbackRate} />
          )}
          <Controls
            audio={audio}
            expanded={expanded}
            duration={duration}
            position={position}
            bufferedPosition={bufferedPosition}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            onTitlePress={onTitlePress}
            onExpandToggle={() => {
              setExpanded(!expanded)
            }}
          />
        </View>
      </Animated.View>
      {expanded && (
        <View
          style={[
            styles.expandedControls,
            {
              bottom: AUDIO_PLAYER_HEIGHT + insets.bottom,
              backgroundColor: colors.overlay,
            },
          ]}>
          <ExpandedControls
            audio={audio}
            onTitlePress={onTitlePress}
            playbackRate={playbackRate}
            isPlaying={isPlaying}
            duration={duration}
            position={position}
          />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  expandedControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
})

export default AudioPlayer
