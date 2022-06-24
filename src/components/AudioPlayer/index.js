import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import TrackPlayer, {
  useProgress,
  usePlaybackState,
  State,
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

export const parseSeconds = value => {
  if (value === null || value === undefined) {
    return ''
  }
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value - minutes * 60)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const getAudioId = audio => {
  if (!audio) {
    return null
  }
  return audio.mediaId || audio.url
}

async function getCurrentPlayingTrack() {
  const currentTrackIndex = await TrackPlayer.getCurrentTrack()
  if (currentTrackIndex == null) {
    return null
  }
  return await TrackPlayer.getTrack(currentTrackIndex)
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
  const { position, duration, bufferedPosition } = useProgress(500)
  const playbackState = usePlaybackState()
  const isPlaying = playbackState === State.Playing
  const audioId = getAudioId(audio)

  const slideIn = useCallback(() => {
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
  }, [opacityAnimatedValue, slideAnimatedValue])

  const slideOut = useCallback(() => {
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
  }, [opacityAnimatedValue, slideAnimatedValue])

  // Handles changes in the audio persisted state, sliding the
  // player in when there is an audio object vs sliding it out
  // once the audio object is wiped from persistedState
  // also triggers playback when a new audio object is set to persistedState,
  // which happens via message API.
  useEffect(() => {
    const loadAudio = async () => {
      // Stop the player
      if (!audioId) {
        console.log('Stopping player')
        await TrackPlayer.reset()
        return
      }
      const shouldAutoPlay = getAudioId(autoPlayAudio) === audioId
      const currentTrack = await getCurrentPlayingTrack()

      // Load audio if not yet playing or if plying a different track
      if (currentTrack === null || currentTrack?.id !== audioId) {
        await TrackPlayer.reset()
        await TrackPlayer.add({
          id: audioId,
          url: audio.url,
          title: audio.title,
          artist: 'Republik',
          artwork: Logo,
        })
        await TrackPlayer.setRate(playbackRate)

        // restart the track at beginning if it was finished in previous session and is initiated again.
        if (audio.currentTime) {
          const seekToTime =
            audio.currentTime >= duration - 5 ? 0 : audio.currentTime
          await TrackPlayer.seekTo(seekToTime)
          await TrackPlayer.setRate(playbackRate)
        }
      }
      if (shouldAutoPlay) {
        await TrackPlayer.play()
        setGlobalState({ autoPlayAudio: null })
      }
    }

    loadAudio()
  }, [
    audioId,
    autoPlayAudio,
    slideAnimatedValue,
    opacityAnimatedValue,
    setGlobalState,
    setPersistedState,
    dispatch,
    duration,
    playbackRate,
    isPlaying,
    audio?.url,
    audio?.title,
    audio?.currentTime,
  ])

  useEffect(() => {
    if (audio) {
      slideIn()
    } else {
      slideOut()
      setExpanded(false)
    }
  }, [audio, slideIn, slideOut, setExpanded])

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
      1000,
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
              playbackRate={playbackRate}
            />
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
