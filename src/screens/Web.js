import React, { Component, Fragment } from 'react'
import {
  AppState, Animated, Keyboard, Platform
} from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import WebView from '../components/WebView'
import AudioPlayer, { AUDIO_PLAYER_HEIGHT, ANIMATION_DURATION } from '../components/AudioPlayer'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import {
  setUrl,
  withAudio,
  setAudio,
  pendingAppSignIn
} from '../apollo'
import mkDebug from '../utils/debug'

const debug = mkDebug('Web')

const getBottom = ({ fullscreen, keyboard }, { audio }) => {
  return !fullscreen && !keyboard && audio
    ? AUDIO_PLAYER_HEIGHT
    : 0
}

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {}

    this.bottom = new Animated.Value(getBottom(this.state, props))
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.goToLoginIfPendingRequest()

    // on iOS the keyboard automatically goes over the audio player
    // - no need to track / hide audio player manually
    if (Platform.OS === 'android') {
      this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        this.setState({ keyboard: true })
      })
      this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        this.setState({ keyboard: false })
      })
    }
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.handleAppStateChange)

    if (Platform.OS === 'android') {
      this.keyboardDidShowListener.remove()
      this.keyboardDidHideListener.remove()
    }
  }

  handleAppStateChange = nextAppState => {
    if (!nextAppState.match(/inactive|background/)) {
      this.goToLoginIfPendingRequest()
      this.props.screenProps.checkForUpdates()
    }
  }

  goToLoginIfPendingRequest = async () => {
    const { refetchPendingSignInRequests } = this.props
    if (!refetchPendingSignInRequests) {
      return
    }
    const { data } = await refetchPendingSignInRequests()
    if (data.pendingAppSignIn) {
      navigator.navigate('Login', { url: data.pendingAppSignIn.verificationUrl })
    }
  }

  onShouldLoad = ({ url }) => {
    this.props.setUrl({ variables: { url } })

    return true
  }

  onLoadStart = () => {
    debug('onLoadStart')
    if (this.state.fullscreen) {
      this.setState({
        fullscreen: false
      })
    }
    if (this.props.screenProps.onLoadStart) {
      this.props.screenProps.onLoadStart()
    }
  }

  onLoadEnd = () => {
    debug('onLoadEnd')
    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd()
    }
  }

  onSignIn = () => {
    // do nothing
    // - web view handles reload
  }

  onMessage = message => {
    switch (message.type) {
      case 'play-audio':
        return this.playAudio(message.payload)
      case 'fullscreen-enter':
        return this.setState({ fullscreen: true })
      case 'fullscreen-exit':
        return this.setState({ fullscreen: false })
      default:
        console.log(message)
        console.warn(`Unhandled message of type: ${message.type}`)
    }
  }

  playAudio = payload => {
    this.props.setAudio({
      variables: payload
    })
  }

  componentWillUpdate (nextProps, nextState) {
    const bottom = getBottom(this.state, this.props)
    const nextBottom = getBottom(nextState, nextProps)
    this.keyboardChange = nextState.keyboard !== this.state.keyboard
    if (bottom !== nextBottom) {
      Animated.timing(this.bottom, {
        toValue: nextBottom,
        duration: this.keyboardChange
          ? 0
          : ANIMATION_DURATION
      }).start()
    }
  }

  componentWillReceiveProps (nextProps) {
    if (
      nextProps.data.url !== this.props.data.url &&
      this.state.fullscreen
    ) {
      this.setState({ fullscreen: false })
    }
  }

  render () {
    const {
      data,
      setUrl
    } = this.props
    const { loading, fullscreen, keyboard } = this.state

    return (
      <Fragment>
        <SafeAreaView fullscreen={fullscreen}>
          <Animated.View style={{
            flex: 1,
            marginBottom: this.bottom
          }}>
            <WebView
              source={{ uri: data.url }}
              onMessage={this.onMessage}
              onLoadEnd={this.onLoadEnd}
              onLoadStart={this.onLoadStart}
              onShouldLoad={this.onShouldLoad}
              onSignIn={this.onSignIn}
              loading={{ status: loading, showSpinner: true }}
            />
          </Animated.View>
          <AudioPlayer
            hidden={fullscreen || keyboard}
            animated={!this.keyboardChange}
            setUrl={setUrl}
          />
        </SafeAreaView>
      </Fragment>
    )
  }
}

const getUrl = graphql(gql`
  query GetUrl {
    url @client
  }
`)

export default compose(
  getUrl,
  setUrl,
  withAudio,
  setAudio,
  pendingAppSignIn
)(Web)
