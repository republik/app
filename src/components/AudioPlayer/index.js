import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native'
import TrackPlayer from 'react-native-track-player'
import Icon from 'react-native-vector-icons/MaterialIcons'

import Logo from '../../assets/images/playlist-logo.png'
import {
  FRONTEND_BASE_URL,
  AUDIO_PLAYER_HEIGHT,
  ANIMATION_DURATION,
} from '../../constants'
import { useGlobalState } from '../../GlobalState'
import { usePrevious } from '../../utils/usePrevious'
import ProgressBar from './ProgressBar'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: AUDIO_PLAYER_HEIGHT,
  },
  content: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: 'GTAmerica-Regular',
  },
  time: {
    fontSize: 14,
    fontFamily: 'GTAmerica-Regular',
    fontVariant: ['tabular-nums'],
  },
})

const parseSeconds = (value) => {
  if (value === null || value === undefined) return ''
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value - minutes * 60)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const Time = ({ duration, position }) => {
  if (!duration) {
    return null
  }
  return (
    <Text style={styles.time}>
      {parseSeconds(position)} / {parseSeconds(duration)}
    </Text>
  )
}

// globalState for stuff like fullscreen or messages, which should be deleted when restart
// persited : audio, darkmode, signin -> things that should persist on shutdown

const AudioPlayer = ({ enableProgress, hidden, animated }) => {
  const { persistedState, setPersistedState, setGlobalState } = useGlobalState()

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState()
  const [position, setPosition] = useState()
  const [bufferedPosition, setBufferedPosition] = useState()
  const [trackReady, setTrackReady] = useState()

  const intervalRef = useRef()

  const { audio } = persistedState
  const previousAudio = usePrevious(audio)

  const icon = isPlaying ? 'pause' : 'play-arrow'
  const rewindIcon = 'fast-rewind'
  const animationDuration = animated ? ANIMATION_DURATION : 0

  const clearTrack = async () => {
    clearInterval(intervalRef.current)
    try {
      await TrackPlayer.stop()
      await TrackPlayer.reset()
    } catch (e) {
      console.warn('clearTrack failed', e)
    }
  }

  const onPlayerStateChange = (playerState) => {
    switch (playerState) {
      case TrackPlayer.STATE_PLAYING:
        TrackPlayer.getDuration().then((newDuration) => {
          setDuration(newDuration)
          setIsPlaying(true)
        })
        break
      case TrackPlayer.STATE_PAUSED:
        setIsPlaying(false)
        break
      case TrackPlayer.STATE_STOPPED:
      case TrackPlayer.STATE_NONE:
        setIsPlaying(false)
        setDuration(undefined)
        setPosition(undefined)
        break
    }
  }

  useEffect(() => {
    const updatePlayerState = async () => {
      try {
        const updatedPosition = Math.floor(await TrackPlayer.getPosition())
        const updatedBufferedPosition = Math.floor(
          await TrackPlayer.getBufferedPosition(),
        )
        const updatedDuration = await TrackPlayer.getDuration()
        setPosition(updatedPosition)
        setBufferedPosition(updatedBufferedPosition)
        setDuration(updatedDuration)
      } catch (e) {
        console.warn('updateState failed', e)
      }
    }

    const startUpdatePlayerState = () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(updatePlayerState, 200)
    }

    if (trackReady) {
      updatePlayerState()
      startUpdatePlayerState()
    }
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [trackReady])

  useEffect(() => {
    const setTrack = async () => {
      await TrackPlayer.setupPlayer({
        capabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
          TrackPlayer.CAPABILITY_STOP,
          TrackPlayer.CAPABILITY_JUMP_FORWARD,
          TrackPlayer.CAPABILITY_JUMP_BACKWARD,
        ],
        options: {
          jumpInterval: 15,
        },
      }).then(() => {
        TrackPlayer.add({
          id: audio.id,
          url: audio.url,
          title: audio.title,
          artist: 'Republik',
          artwork: Logo,
        })
      })
      setTrackReady(true)
    }
    const updateAudio = async () => {
      if (audio) {
        const isSameAudio =
          (audio && audio.id) !== (previousAudio && previousAudio.audio.id)
        if (isSameAudio) {
          return
        }
        if (previousAudio) {
          clearTrack(false)
        }
        await setTrack()
        TrackPlayer.play().then(() => {
          TrackPlayer.getState().then((playerState) => {
            onPlayerStateChange(playerState)
          })
        })
      }
    }
    updateAudio()
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [audio, previousAudio])

  const onPlayPauseClick = () => {
    if (isPlaying) {
      TrackPlayer.pause()
    } else {
      TrackPlayer.play()
    }
  }

  const onPositionStart = (newPosition) => {
    setPosition(newPosition)
    clearInterval(intervalRef.current)
  }

  const onPositionReleased = () => {
    try {
      TrackPlayer.seekTo(position)
    } catch (e) {
      console.warn('onPositionReleased failed', e)
    }
    // startUpdatePlayerState()
  }

  const onRewind = () => {
    TrackPlayer.seekTo(0)
  }

  const onTitlePress = () => {
    if (audio && audio.sourcePath) {
      setGlobalState({
        pendingUrl: `${FRONTEND_BASE_URL}${audio.sourcePath}`,
      })
    }
  }

  return (
    <Animated.View style={[styles.container, { bottom: this.bottom }]}>
      <ProgressBar
        audio={audio}
        upsertCurrentMediaProgress={(progress) =>
          setPersistedState({ mediaProgress: progress.varibles })
        }
        enableProgress={enableProgress}
        position={position}
        isPlaying={isPlaying}
        duration={duration}
        bufferedPosition={bufferedPosition}
        onPositionStart={onPositionStart}
        onPositionChange={setPosition}
        onPositionReleased={onPositionReleased}
      />
      <Icon
        name={icon}
        style={{ marginLeft: 10 }}
        size={35}
        onPress={() => onPlayPauseClick()}
      />
      <Icon
        name={rewindIcon}
        disabled={position !== undefined && position < 0.1}
        style={{ marginLeft: 5 }}
        size={25}
        onPress={() => onRewind()}
      />
      <View style={styles.content}>
        <>
          <TouchableOpacity onPress={onTitlePress}>
            <Text numberOfLines={1} style={styles.title}>
              {audio && audio.title}
            </Text>
          </TouchableOpacity>
          <Time duration={duration} position={position} />
        </>
      </View>
      <Icon
        name="close"
        size={35}
        style={{ marginRight: 10 }}
        onPress={() =>
          setPersistedState({
            audio: {},
          })
        }
      />
    </Animated.View>
  )
}

export default AudioPlayer
