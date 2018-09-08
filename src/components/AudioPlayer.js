import React, { Component, Fragment } from 'react'
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import Icon from './Icon'
import { withAudio, setAudio, withPlaybackState, setPlaybackState } from '../apollo'
import Logo from '../assets/images/playlist-logo.png'
import { FRONTEND_BASE_URL } from '../constants'
import { compose } from 'react-apollo'

export const AUDIO_PLAYER_HEIGHT = 65
export const ANIMATION_DURATION = 250

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: AUDIO_PLAYER_HEIGHT
  },
  progressBarContainer: {
    top: 0,
    height: 18,
    width: '100%',
    position: 'absolute'
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#e8e8ed'
  },
  progressPosition: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
    backgroundColor: '#3cad01'
  },
  progressBuffer: {
    top: 0,
    left: 0,
    height: '100%',
    position: 'absolute',
    backgroundColor: '#bebdcc'
  },
  content: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 18,
    fontFamily: 'GT America'
  },
  time: {
    fontSize: 14,
    fontFamily: 'GT America',
    fontVariant: ['tabular-nums']
  }
})

const parseSeconds = (value) => {
  if (value === null || value === undefined) return ''
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value - (minutes * 60))
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

class ProgressBar extends Component {
  constructor (props, context) {
    super(props, context)

    this.height = new Animated.Value(5)

    this.pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { width } = Dimensions.get('window')
        this.props.onPositionStart((gestureState.x0 / width) * this.props.duration)
        Animated.timing(this.height, { toValue: 15, duration: ANIMATION_DURATION }).start()
      },
      onPanResponderMove: (evt, gestureState) => {
        const { width } = Dimensions.get('window')
        this.props.onPositionChange((gestureState.moveX / width) * this.props.duration)
      },
      onPanResponderRelease: (evt, gestureState) => {
        this.props.onPositionReleased()
        Animated.timing(this.height, { toValue: 5, duration: ANIMATION_DURATION }).start()
      }
    })
  }

  render () {
    const { position, bufferedPosition, duration } = this.props
    const progress = (position / duration) * 100
    const buffered = (bufferedPosition / duration) * 100

    return (
      <View style={styles.progressBarContainer} {...this.pan.panHandlers}>
        <Animated.View style={[styles.progressBar, { height: this.height }]}>
          <View style={[styles.progressBuffer, { width: `${buffered}%` }]} />
          <View style={[styles.progressPosition, { width: `${progress}%` }]} />
        </Animated.View>
      </View>
    )
  }
}

class AudioPlayer extends Component {
  constructor (props) {
    super(props)

    this.bottom = new Animated.Value(
      props.audio && !props.hidden
        ? 0
        : -AUDIO_PLAYER_HEIGHT
    )
    this.state = {
      isPlaying: false
    }
  }

  async componentWillReceiveProps (nextProps) {
    const duration = nextProps.animated
      ? ANIMATION_DURATION
      : 0
    if (nextProps.audio) {
      if (
        (this.state.audio && this.state.audio.id) !==
        (nextProps.audio && nextProps.audio.id)
      ) {
        await this.setTrack(nextProps)
        TrackPlayer.play()
      }
      if (nextProps.hidden) {
        Animated.timing(this.bottom, { toValue: -AUDIO_PLAYER_HEIGHT, duration }).start()
      } else {
        Animated.timing(this.bottom, { toValue: 0, duration }).start()
      }
    } else if (this.state.audio) {
      await this.clearTrack()
      Animated.timing(this.bottom, { toValue: -AUDIO_PLAYER_HEIGHT, duration }).start()
    }
    // see TrackPlayer.registerEventHandler in the root index.js
    if (this.props.playbackState !== nextProps.playbackState) {
      await this.onPlaybackStateChange(nextProps.playbackState)
    }
  }

  async componentDidMount () {
    if (this.props.audio) {
      await this.setTrack(this.props)
      const state = await TrackPlayer.getState()
      if (state !== this.props.playbackState) {
        this.props.setPlaybackState({ variables: { state } })
      }
      await this.onPlaybackStateChange(state)
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
        TrackPlayer.CAPABILITY_STOP
      ]
    })
  }

  setTrack = async ({ audio }) => {
    if (
      (this.state.audio && this.state.audio.id) ===
      (audio && audio.id)
    ) {
      return
    }
    const prevAudio = this.state.audio
    this.setState({
      audio
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
      artwork: Logo
    })
    this.startUpdateInterval()
  }

  clearTrack = async (setState = true) => {
    setState && this.setState({
      audio: undefined
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
      TrackPlayer.play()
    }
  }

  onPlaybackStateChange = async state => {
    switch (state) {
      case TrackPlayer.STATE_PLAYING:
        const duration = await TrackPlayer.getDuration()
        this.setState({ isPlaying: true, duration })
        break
      case TrackPlayer.STATE_PAUSED:
        this.setState({ isPlaying: false })
        break
      case TrackPlayer.STATE_STOPPED:
      case TrackPlayer.STATE_NONE:
        this.setState({
          isPlaying: false,
          duration: undefined,
          position: undefined
        })
        break
    }
  }

  onPositionStart = position => {
    this.onPositionChange(position)
    this.stopUpdateInterval()
  }

  onPositionChange = position => {
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
      this.props.setUrl({
        variables: {
          url: `${FRONTEND_BASE_URL}${audio.sourcePath}`
        }
      })
    }
  }

  componentWillUnmount () {
    this.stopUpdateInterval()
  }

  updateState = async () => {
    try {
      const position = Math.floor(await TrackPlayer.getPosition())
      const bufferedPosition = Math.floor(await TrackPlayer.getBufferedPosition())
      if (this.state.position !== position) {
        this.setState({ position })
      }
      if (this.state.bufferedPosition !== bufferedPosition) {
        this.setState({ bufferedPosition })
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

  render () {
    const { setAudio } = this.props
    const { audio, isPlaying, duration, position, bufferedPosition } = this.state
    const icon = isPlaying ? 'pause' : 'play'

    return (
      <Animated.View style={[styles.container, { bottom: this.bottom }]}>
        <ProgressBar
          position={position}
          duration={duration}
          bufferedPosition={bufferedPosition}
          onPositionStart={this.onPositionStart}
          onPositionChange={this.onPositionChange}
          onPositionReleased={this.onPositionReleased}
        />
        <Icon
          type={icon}
          size={35}
          style={{ marginLeft: 15 }}
          onPress={() => this.onPlayPauseClick()}
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
          type='close'
          size={35}
          style={{ marginRight: 15 }}
          onPress={() => setAudio({
            variables: { url: null }
          })}
        />
      </Animated.View>
    )
  }
}

export default compose(
  withAudio,
  withPlaybackState,
  setAudio,
  setPlaybackState
)(AudioPlayer)
