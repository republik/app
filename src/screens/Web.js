import React, { Component, Fragment } from 'react'
import {
  AppState, NetInfo, Platform, KeyboardAvoidingView
} from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parse } from 'url'
import WebView from '../components/WebView'
import AudioPlayer from '../components/AudioPlayer'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import { FRONTEND_HOST, SIGN_IN_PATH } from '../constants'
import {
  withMe,
  setUrl,
  setAudio,
  pendingAppSignIn
} from '../apollo'
import mkDebug from '../utils/debug'

const debug = mkDebug('Web')

const RELOAD_TIME_THRESHOLD = 60 * 60 * 1000 // 1hr

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      webInstance: 1
    }

    this.shouldReload = false
    this.lastActiveDate = null
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.goToLoginIfPendingRequest()
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  handleAppStateChange = async (nextAppState) => {
    if (nextAppState.match(/inactive|background/)) {
      this.lastActiveDate = Date.now()
    } else {
      if (this.lastActiveDate) {
        this.shouldReload = this.shouldReload ||
          Date.now() - this.lastActiveDate > RELOAD_TIME_THRESHOLD
      }

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

  setLoading = debounce(value => {
    this.setState({ loading: value })
  }, 150)

  onNavigationStateChange = (data) => {
    this.props.setUrl({ variables: { url: data.url } })
    this.reloadIfNeccesary()

    return true
  }

  reloadIfNeccesary = async () => {
    const url = parse(this.props.data.url || '')
    const isConnected = await NetInfo.isConnected.fetch()

    if (
      isConnected &&
      this.shouldReload &&
      url.pathname !== SIGN_IN_PATH
    ) {
      this.setState({
        loading: true,
        webInstance: this.state.webInstance + 1
      })
      this.shouldReload = false
    }
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
    if (!this.state.loading) {
      this.setState({
        networkActivity: true
      })
    }
  }

  onLoadStop = () => {
    this.setState({
      networkActivity: false
    })
  }

  onLoadEnd = () => {
    debug('onLoadEnd')

    this.setLoading(false)
    this.setState({
      networkActivity: false
    })

    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd()
    }
  }

  onSignIn = () => {
    this.props.screenProps.getNotificationsToken()
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
      me, data,
      setUrl,
      navigation
    } = this.props
    const { loading, fullscreen, networkActivity, webInstance } = this.state

    return (
      <Fragment>
        <SafeAreaView fullscreen={fullscreen} networkActivity={networkActivity}>
          <WebView
            key={`${me ? me.id : 'anon'}:${webInstance}`}
            source={{ uri: data.url }}
            onMessage={this.onMessage}
            onLoadEnd={this.onLoadEnd}
            onLoadStop={this.onLoadStop}
            onLoadStart={this.onLoadStart}
            onNavigationStateChange={this.onNavigationStateChange}
            onSignIn={this.onSignIn}
            loading={{ status: loading, showSpinner: true }}
          />
          <AudioPlayer
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
  withMe,
  getUrl,
  setUrl,
  setAudio,
  pendingAppSignIn
)(Web)
