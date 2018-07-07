import React from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import Icon from './Icon'
import { setAudio } from '../apollo'

const AUDIO_PLAYER_HEIGHT = 60

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: AUDIO_PLAYER_HEIGHT
  },
  progressBar: {
    top: 0,
    height: 5,
    width: '100%',
    position: 'absolute',
    backgroundColor: '#e8e8ed'
  },
  progressPosition: {
    top: 0,
    left: 0,
    height: 5,
    position: 'absolute',
    backgroundColor: '#3cad01'
  },
  progressBuffer: {
    top: 0,
    left: 0,
    height: 5,
    position: 'absolute',
    backgroundColor: '#bebdcc'
  },
  content: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start'
  },
  time: {
    fontSize: 18
  }
})

const parseSeconds = (value) => {
  if (value === null || value === undefined) return ''
  const minutes = Math.floor(value / 60)
  const seconds = (value - (minutes * 60)).toFixed(0)
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const Time = ({ loading, duration, position }) => {
  if (loading) return <ActivityIndicator />

  return (
    <Text style={styles.time}>
      {parseSeconds(position)} / {parseSeconds(duration)}
    </Text>
  )
}

class AudioPlayer extends React.Component {
  constructor (props) {
    super(props)

    this.bottom = new Animated.Value(props.url ? 0 : -AUDIO_PLAYER_HEIGHT)
    this.state = {
      loading: false,
      isPlaying: false,
      position: 0,
      bufferedPosition: 0
    }
  }

  componentDidMount () {
    TrackPlayer.setupPlayer()
    TrackPlayer.registerEventHandler(this.onEvent)
  }

  async componentWillReceiveProps (nextProps) {
    if (!this.props.url && nextProps.url) {
      await TrackPlayer.add({
        id: 'republik',
        url: nextProps.url,
        title: 'Track Title',
        artist: 'Track Artist'
      })
      this.startIntervals()
      this.setState({ loading: true })
      TrackPlayer.play()
      Animated.timing(this.bottom, { toValue: 0, duration: 250 }).start()
    } else if (this.props.url && !nextProps.url) {
      await TrackPlayer.reset()
      this.stopIntervals()
      Animated.timing(this.bottom, {
        toValue: -AUDIO_PLAYER_HEIGHT, duration: 250
      }).start()
    }
  }

  componentWillUnmount () {
    this.stopIntervals()
  }

  onEvent = async event => {
    switch (event.type) {
      case 'playback-state':
        return this.onPlaybackStateChange(event)
    }
  }

  onPlaybackStateChange = async event => {
    switch (event.state) {
      case 'playing':
        if (this.state.loading) {
          this.setState({
            loading: false,
            duration: await TrackPlayer.getDuration()
          })
          TrackPlayer.pause()
        } else {
          this.setState({
            isPlaying: true,
            duration: await TrackPlayer.getDuration()
          })
        }
        break
      case 'paused':
        this.setState({ isPlaying: false })
        break
      case 'stopped':
        setTimeout(() => { // Delay stte change to make animation nicer
          this.setState({ isPlaying: false, duration: null, position: 0 })
        }, 250)
        break
    }
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

  updateProgress = async () => {
    try {
      this.setState({ position: await TrackPlayer.getPosition() })
    } catch (e) {
      // The player is probably not initialized yet, we'll just ignore it
    }
  }

  updateBufferProgress = async () => {
    try {
      this.setState({ bufferedPosition: await TrackPlayer.getBufferedPosition() })
    } catch (e) {
      // The player is probably not initialized yet, we'll just ignore it
    }
  }

  render () {
    const { setAudio } = this.props
    const { loading, isPlaying, duration, position, bufferedPosition } = this.state
    const icon = isPlaying ? 'pause' : 'play'
    const progress = (position / duration) * 100
    const buffered = (bufferedPosition / duration) * 100

    return (
      <Animated.View style={[styles.container, { bottom: this.bottom }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressBuffer, { width: `${buffered}%` }]} />
          <View style={[styles.progressPosition, { width: `${progress}%` }]} />
        </View>
        <Icon
          type={icon}
          size={35}
          style={{ marginLeft: 15 }}
          onPress={() => this.onPlayPauseClick()}
        />
        <View style={styles.content}>
          <Time
            loading={loading}
            duration={duration}
            position={position}
          />
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
