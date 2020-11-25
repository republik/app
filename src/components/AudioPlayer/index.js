import React, { Component, Fragment, useState, useEffect, useRef } from 'react'
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

// const AudioPlayer = ({
//   setAudio,
//   upsertCurrentMediaProgress,
//   enableProgress,
//   hidden,
//   audio,
//   animated,
//   progressLoading,
// }) => {
//   const [audioState, setAudioState] = useState()
//   const [isPlaying, setIsPlaying] = useState()
//   const [duration, setDuration] = useState()
//   const [position, setPosition] = useState()
//   const [bufferedPosition, setBufferedPosition] = useState()
//   const bottom = new Animated.Value(audio && !hidden ? 0 : 100)
//   const prevHidden = useRef(hidden)
//   const prevAudio = useRef(audio)
//   const prevAnimated = useRef(animated)

//   useEffect(() => {
//     const functionQuestionMark = async () => {
//       const duration = animated ? ANIMATION_DURATION : 0
//       if (audio) {
//         if (
//           !progressLoading &&
//           (audioState && audioState.id) !== (audio && audio.id)
//         ) {
//           await setTrack(nextProps)
//           TrackPlayer.play()
//         }
//         if (nextProps.hidden) {
//           Animated.timing(this.bottom, {
//             toValue: -AUDIO_PLAYER_HEIGHT,
//             duration,
//           }).start()
//         } else {
//           Animated.timing(this.bottom, { toValue: 0, duration }).start()
//         }
//       } else if (this.state.audio) {
//         await this.clearTrack()
//         Animated.timing(this.bottom, {
//           toValue: -AUDIO_PLAYER_HEIGHT,
//           duration,
//         }).start()
//       }
//       // see TrackPlayer.registerEventHandler in the root index.js
//       if (this.props.playbackState !== nextProps.playbackState) {
//         await this.onPlaybackStateChange(nextProps.playbackState)
//       }
//     }
//     functionQuestionMark()
//     return () => {
//       cleanup
//     }
//   }, [input])
//   return (
//     <Animated.View style={[styles.container, { bottom: this.bottom }]}>
//       <ProgressBar
//         audio={audio}
//         upsertCurrentMediaProgress={upsertCurrentMediaProgress}
//         enableProgress={enableProgress}
//         position={position}
//         isPlaying={isPlaying}
//         duration={duration}
//         bufferedPosition={bufferedPosition}
//         onPositionStart={this.onPositionStart}
//         onPositionChange={this.onPositionChange}
//         onPositionReleased={this.onPositionReleased}
//       />
//       <Icon
//         name={icon}
//         style={{ marginLeft: 10 }}
//         size={35}
//         onPress={() => this.onPlayPauseClick()}
//       />
//       <Icon
//         name={rewindIcon}
//         disabled={position !== undefined && position < 0.1}
//         style={{ marginLeft: 5 }}
//         size={25}
//         onPress={() => this.onRewind()}
//       />
//       <View style={styles.content}>
//         <Fragment>
//           <TouchableOpacity onPress={this.onTitlePress}>
//             <Text numberOfLines={1} style={styles.title}>
//               {audio && audio.title}
//             </Text>
//           </TouchableOpacity>
//           <Time duration={duration} position={position} />
//         </Fragment>
//       </View>
//       <Icon
//         name="close"
//         size={35}
//         style={{ marginRight: 10 }}
//         onPress={() =>
//           setAudio({
//             variables: { url: null },
//           })
//         }
//       />
//     </Animated.View>
//   )
// }

class AudioPlayerOld extends Component {
  constructor(props) {
    super(props)

    this.bottom = new Animated.Value(
      props.audio && !props.hidden ? 0 : -AUDIO_PLAYER_HEIGHT,
    )
    this.state = {
      isPlaying: false,
    }
  }

  async componentWillReceiveProps(nextProps) {
    console.warn('componentWillRecieve', nextProps)
    const duration = nextProps.animated ? ANIMATION_DURATION : 0
    if (nextProps.audio) {
      if (
        !nextProps.progressLoading &&
        (this.state.audio && this.state.audio.id) !==
          (nextProps.audio && nextProps.audio.id)
      ) {
        await this.setTrack(nextProps)
        TrackPlayer.play()
      }
      if (nextProps.hidden) {
        Animated.timing(this.bottom, {
          toValue: -AUDIO_PLAYER_HEIGHT,
          duration,
          useNativeDriver: false,
        }).start()
      } else {
        Animated.timing(this.bottom, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }).start()
      }
    } else if (this.state.audio) {
      await this.clearTrack()
      Animated.timing(this.bottom, {
        toValue: -AUDIO_PLAYER_HEIGHT,
        duration,
        useNativeDriver: false,
      }).start()
    }
    // see TrackPlayer.registerEventHandler in the root index.js
    // if (this.props.playbackState !== nextProps.playbackState) {
    //   await this.onPlaybackStateChange(nextProps.playbackState)
    // }
  }

  async componentDidMount() {
    console.warn('componentDidMount', this.props, this.props.audio)
    if (this.props.audio) {
      await this.setTrack(this.props)
      const state = await TrackPlayer.getState()
      // if (state !== this.props.playbackState) {
      //   this.props.setPlaybackState({ variables: { state } })
      // }
      // await this.onPlaybackStateChange(state)
    }
  }

  setupPlayer = async () => {
    if (this.started) {
      return
    }

    this.started = true

    await TrackPlayer.setupPlayer()
    await TrackPlayer.updateOptions({
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
    })
  }

  setTrack = async ({ audio, mediaProgress }) => {
    console.warn('setTrack', audio)
    // if ((this.state.audio && this.state.audio.id) === (audio && audio.id)) {
    //   return
    // }
    const prevAudio = this.state.audio
    this.setState({
      audio,
    })
    if (prevAudio) {
      await this.clearTrack(false)
    }
    await this.setupPlayer()
    await TrackPlayer.add({
      id: audio.id,
      url: audio.url,
      title: audio.title,
      artist: 'Republik',
      artwork: Logo,
    })
    await TrackPlayer.seekTo(0)
    this.updateState()
    this.startUpdateInterval()
  }

  clearTrack = async (setState = true) => {
    setState &&
      this.setState({
        audio: undefined,
      })
    this.stopUpdateInterval()
    try {
      await TrackPlayer.stop()
      await TrackPlayer.reset()
    } catch (e) {
      console.warn('clearTrack failed', e)
    }
  }

  onPlayPauseClick = () => {
    if (this.state.isPlaying) {
      TrackPlayer.pause()
    } else {
      console.warn('play')
      TrackPlayer.play()
    }
  }

  // onPlaybackStateChange = async (state) => {
  //   switch (state) {
  //     case TrackPlayer.STATE_PLAYING:
  //       const duration = await TrackPlayer.getDuration()
  //       this.setState({ isPlaying: true, duration })
  //       break
  //     case TrackPlayer.STATE_PAUSED:
  //       this.setState({ isPlaying: false })
  //       break
  //     case TrackPlayer.STATE_STOPPED:
  //     case TrackPlayer.STATE_NONE:
  //       this.setState({
  //         isPlaying: false,
  //         duration: undefined,
  //         position: undefined,
  //       })
  //       break
  //   }
  // }

  onPositionStart = (position) => {
    this.onPositionChange(position)
    this.stopUpdateInterval()
  }

  onPositionChange = (position) => {
    this.setState({ position })
  }

  onPositionReleased = () => {
    try {
      TrackPlayer.seekTo(this.state.position)
    } catch (e) {
      console.warn('onPositionReleased failed', e)
    }
    this.startUpdateInterval()
  }

  onTitlePress = () => {
    const { audio } = this.state

    if (audio && audio.sourcePath) {
      this.props.setGlobalState({
        pendingUrl: `${FRONTEND_BASE_URL}${audio.sourcePath}`,
      })
    }
  }

  onRewind = () => {
    TrackPlayer.seekTo(0)
  }

  componentWillUnmount() {
    this.stopUpdateInterval()
  }

  updateState = async () => {
    try {
      const position = Math.floor(await TrackPlayer.getPosition())
      const bufferedPosition = Math.floor(
        await TrackPlayer.getBufferedPosition(),
      )
      if (this.state.position !== position) {
        this.setState({ position })
      }
      if (this.state.bufferedPosition !== bufferedPosition) {
        this.setState({ bufferedPosition })
      }
      if (!this.state.duration) {
        const duration = await TrackPlayer.getDuration()
        this.setState({ duration })
      }
    } catch (e) {
      console.warn('updateState failed', e)
    }
  }

  startUpdateInterval = () => {
    if (this.updateInterval !== undefined) {
      this.stopUpdateInterval()
    }
    this.updateInterval = setInterval(this.updateState, 200)
  }

  stopUpdateInterval = () => {
    clearInterval(this.updateInterval)
  }

  render() {
    const {
      clearAudio,
      upsertCurrentMediaProgress,
      enableProgress,
    } = this.props
    const {
      audio,
      isPlaying,
      duration,
      position,
      bufferedPosition,
    } = this.state

    const icon = isPlaying ? 'pause' : 'play-arrow'
    const rewindIcon = 'fast-rewind'
    return (
      <Animated.View style={[styles.container, { bottom: this.bottom }]}>
        <ProgressBar
          audio={audio}
          upsertCurrentMediaProgress={upsertCurrentMediaProgress}
          enableProgress={enableProgress}
          position={position}
          isPlaying={isPlaying}
          duration={duration}
          bufferedPosition={bufferedPosition}
          onPositionStart={this.onPositionStart}
          onPositionChange={this.onPositionChange}
          onPositionReleased={this.onPositionReleased}
        />
        <Icon
          name={icon}
          style={{ marginLeft: 10 }}
          size={35}
          onPress={() => this.onPlayPauseClick()}
        />
        <Icon
          name={rewindIcon}
          disabled={position !== undefined && position < 0.1}
          style={{ marginLeft: 5 }}
          size={25}
          onPress={() => this.onRewind()}
        />
        <View style={styles.content}>
          <Fragment>
            <TouchableOpacity onPress={this.onTitlePress}>
              <Text numberOfLines={1} style={styles.title}>
                {audio && audio.title}
              </Text>
            </TouchableOpacity>
            <Time duration={duration} position={position} />
          </Fragment>
        </View>
        <Icon
          name="close"
          size={35}
          style={{ marginRight: 10 }}
          onPress={() =>
            this.props.setPersistedState({
              audio: {},
            })
          }
        />
      </Animated.View>
    )
  }
}

const WrappedAudioPlayer = ({ ...props }) => {
  const {
    globalState,
    setGlobalState,
    persistedState,
    setPersistedState,
  } = useGlobalState()
  return (
    <AudioPlayerOld
      {...props}
      setGlobalState={setGlobalState}
      setPersistedState={setPersistedState}
      audio={persistedState.audio}
      hidden={false}
    />
  )
}

// globalState for stuff like fullscreen or messages, which should be deleted when restart
// persited : audio, darkmode, signin -> things that should persist on shutdown

export default WrappedAudioPlayer
