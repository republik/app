import React, { Fragment } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator, PanResponder, Dimensions, TouchableOpacity } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import Icon from './Icon'
import { setAudio } from '../apollo'
import Logo from '../assets/images/playlist-logo.png'
import { FRONTEND_BASE_URL } from '../constants'

const AUDIO_PLAYER_HEIGHT = 65

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
    fontSize: 18
  },
  time: {
    fontSize: 14
  }
})

const parseSeconds = (value) => {
  if (value === null || value === undefined) return ''
  const minutes = Math.floor(value / 60)
  const seconds = (value - (minutes * 60)).toFixed(0)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const Time = ({ duration, position }) => (
  <Text style={styles.time}>
    {parseSeconds(position)} / {parseSeconds(duration)}
  </Text>
)

const height = new Animated.Value(5)

class ProgressBar extends React.Component {
  constructor (props) {
    super(props)

    const SCREEN_WIDTH = Dimensions.get('window').width

    this.pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        props.onPositionStart()
        Animated.timing(height, { toValue: 15, duration: 250 }).start()
      },
      onPanResponderMove: (evt, gestureState) => {
        props.onPositionChange((gestureState.moveX / SCREEN_WIDTH) * this.props.duration)
      },
      onPanResponderRelease: (evt, gestureState) => {
        props.onPositionReleased()
        Animated.timing(height, { toValue: 5, duration: 250 }).start()
      }
    })
  }

  render () {
    const { position, bufferedPosition, duration } = this.props
    const progress = (position / duration) * 100
    const buffered = (bufferedPosition / duration) * 100

    return (
      <View style={styles.progressBarContainer} {...this.pan.panHandlers}>
        <Animated.View style={[styles.progressBar, { height }]}>
          <View style={[styles.progressBuffer, { width: `${buffered}%` }]} />
          <View style={[styles.progressPosition, { width: `${progress}%` }]} />
        </Animated.View>
      </View>
    )
  }
}

class AudioPlayer extends React.Component {
  constructor (props) {
    super(props)

    this.started = false
    this.bottom = new Animated.Value(props.url ? 0 : -AUDIO_PLAYER_HEIGHT)
    this.state = {
      position: 0,
      loading: false,
      isPlaying: false,
      bufferedPosition: 0,
      audioUrl: props.url,
      articleTitle: props.title,
      articlePath: props.articlePath
    }
  }

  async componentWillReceiveProps (nextProps) {
    if (!this.started && nextProps.url) {
      await this.setupPlayer()
      this.startIntervals()
      this.started = true
    }

    if (!this.state.audioUrl && nextProps.url) {
      this.setState({
        loading: true,
        audioUrl: nextProps.url,
        articleTitle: nextProps.title,
        articlePath: nextProps.articlePath
      })
      await this.startPlaying(nextProps)
      Animated.timing(this.bottom, { toValue: 0, duration: 250 }).start()
    } else if (this.state.audioUrl && !nextProps.url) {
      await this.stopPlaying()
      Animated.timing(this.bottom, { toValue: -AUDIO_PLAYER_HEIGHT, duration: 250 }).start()
      this.setState({ audioUrl: null })
    } else if (this.state.audioUrl !== nextProps.url) {
      this.setState({
        audioUrl: nextProps.url,
        articleTitle: nextProps.title,
        articlePath: nextProps.articlePath
      })
      await this.stopPlaying()
      await this.startPlaying(nextProps)
    }

    if (this.props.playbackState !== nextProps.playbackState) {
      await this.onPlaybackStateChange(nextProps.playbackState)
    }
  }

  componentWillUnmount () {
    this.stopIntervals()
  }

  setupPlayer = async () => {
    await TrackPlayer.setupPlayer()
    await TrackPlayer.updateOptions({
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_STOP
      ]
    })
  }

  startPlaying = async (playback) => {
    await TrackPlayer.add({
      id: playback.title,
      url: playback.url,
      title: playback.title,
      artist: 'Republik',
      artwork: Logo
    })
    TrackPlayer.play()
  }

  stopPlaying = async () => {
    await TrackPlayer.stop()
    await TrackPlayer.reset()
  }

  startIntervals = () => {
    this.progressTimer = setInterval(this.updateProgress, 1000)
    this.bufferTimer = setInterval(this.updateBufferProgress, 300)
  }

  stopIntervals = () => {
    clearInterval(this.progressTimer)
    clearInterval(this.bufferTimer)
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
        if (this.state.loading) {
          this.setState({ loading: false, duration })
          TrackPlayer.pause()
        } else {
          this.setState({ isPlaying: true, duration })
        }
        break
      case TrackPlayer.STATE_PAUSED:
        this.setState({ isPlaying: false })
        break
      case TrackPlayer.STATE_STOPPED:
        setTimeout(() => { // Delay stte change to make animation nicer
          this.setState({ isPlaying: false, duration: null, position: 0 })
        }, 250)
        break
      case TrackPlayer.STATE_NONE:
        this.setState({ isPlaying: false, duration: null, position: 0 })
        break
    }
  }

  onPositionChange = position => {
    this.setState({ position })
  }

  onPositionStart = () => {
    this.stopIntervals()
  }

  onPositionReleased = () => {
    try {
      TrackPlayer.seekTo(this.state.position)
      setTimeout(() => {
        this.startIntervals()
      }, 250)
    } catch (e) {
      // The player is probably not initialized yet, we'll just ignore it
    }
  }

  updateProgress = async () => {
    try {
      const position = await TrackPlayer.getPosition()
      if (this.state.position !== position) {
        this.setState({ position })
      }
    } catch (e) {
      // The player is probably not initialized yet, we'll just ignore it
    }
  }

  updateBufferProgress = async () => {
    try {
      const bufferedPosition = await TrackPlayer.getBufferedPosition()
      if (this.state.bufferedPosition !== bufferedPosition) {
        this.setState({ bufferedPosition })
      }
    } catch (e) {
      // The player is probably not initialized yet, we'll just ignore it
    }
  }

  onTitlePress = () => {
    const { articlePath } = this.state

    if (articlePath) {
      this.props.setUrl({ variables: { url: `${FRONTEND_BASE_URL}${articlePath}` } })
    }
  }

  render () {
    const { setAudio } = this.props
    const { articleTitle, loading, isPlaying, duration, position, bufferedPosition } = this.state
    const icon = isPlaying ? 'pause' : 'play'

    return (
      <Animated.View style={[styles.container, { bottom: this.bottom }]}>
        <ProgressBar
          position={position}
          duration={duration}
          bufferedPosition={bufferedPosition}
          onPositionChange={this.onPositionChange}
          onPositionStart={this.onPositionStart}
          onPositionReleased={this.onPositionReleased}
        />
        <Icon
          type={icon}
          size={35}
          style={{ marginLeft: 15 }}
          onPress={() => this.onPlayPauseClick()}
        />
        <View style={styles.content}>
          { loading
            ? <ActivityIndicator />
            : (
              <Fragment>
                <TouchableOpacity onPress={this.onTitlePress}>
                  <Text numberOfLines={1} style={styles.title}>
                    {articleTitle}
                  </Text>
                </TouchableOpacity>
                <Time duration={duration} position={position} />
              </Fragment>
            )
          }
        </View>
        <Icon
          type="close"
          size={35}
          style={{ marginRight: 15 }}
          onPress={() => setAudio({ variables: { audio: null } })}
        />
      </Animated.View>
    )
  }
}

export default setAudio(AudioPlayer)
