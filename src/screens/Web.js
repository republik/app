import React, { Component, Fragment } from 'react'
import {
  AppState, NetInfo, Platform
} from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parse } from 'url'
import WebView from '../components/WebView'
import AudioPlayer from '../components/AudioPlayer'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import { FRONTEND_HOST, LOGIN_PATH } from '../constants'
import {
  me,
  login,
  logout,
  setUrl,
  setAudio,
  pendingAppSignIn
} from '../apollo'
import mkDebug from '../utils/debug'

const debug = mkDebug('Web')

const RELOAD_OFFSET_HEIGHT = 5
const RELOAD_TIME_THRESHOLD = 60 * 60 * 1000 // 1hr

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      refreshing: false
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
      url.pathname !== LOGIN_PATH
    ) {
      this.setState({ loading: true })
      this.webview.reload()
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

    if (this.state.refreshing) {
      this.setState({ refreshing: false })
      this.webview.postMessage({ type: 'scroll-to-top' })
    }

    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd()
    }
  }

  onMessage = message => {
    switch (message.type) {
      case 'initial-state':
        return this.loadInitialState(message.payload)
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

  loadInitialState = (payload) => {
    const { me } = this.props

    debug('loadInitialState', 'props.me', !!me, 'payload.me', !!payload.me)
    if (payload.me && !me) {
      return this.loginUser(payload.me, { reload: true })
    }

    if (!payload.me && me) {
      return this.logoutUser({ reload: false })
    }
  }

  playAudio = payload => {
    this.props.setAudio({
      variables: payload
    })
  }

  onNetwork = async ({ query, data }) => {
    const { me, login } = this.props
    const { definitions } = query
    const operations = definitions.map(definition => definition.name && definition.name.value)

    debug('onNetwork', operations, Object.keys(data.data).map(key => [key, !!data.data[key]]))

    if (operations.includes('signOut')) {
      await this.logoutUser()
    }

    // User logs in
    if (operations.includes('me')) {
      if (data.data.me && !me) {
        await this.loginUser(data.data.me)
      }

      // User got unauthenticated
      if (!data.data.me && me) {
        await this.logoutUser()
      }
    }

    // User is updated
    if (operations.includes('updateMe')) {
      await login({
        variables: {
          user: data.data.updateMe
        }
      })
    }
  }

  onRefresh = () => {
    this.setState({ refreshing: true })
    this.webview.reload()
  }

  loginUser = async (user, { reload = true } = {}) => {
    debug('loginUser', user.email, { reload })

    await this.props.login({ variables: { user } })

    // Force webview reload to update request cookies on iOS
    if (reload && Platform.OS === 'ios') this.webview.reload()

    this.props.screenProps.getNotificationsToken()
  }

  logoutUser = async ({ reload = true } = {}) => {
    debug('logoutUser', { reload })
    await this.props.logout()
    if (reload && Platform.OS === 'ios') this.webview.reload()
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
    const { loading, refreshing, fullscreen, networkActivity } = this.state

    return (
      <Fragment>
        <SafeAreaView fullscreen={fullscreen} networkActivity={networkActivity}>
          <WebView
            source={{ uri: data.url }}
            onNetwork={this.onNetwork}
            onMessage={this.onMessage}
            onLoadEnd={this.onLoadEnd}
            onLoadStop={this.onLoadStop}
            onLoadStart={this.onLoadStart}
            onNavigationStateChange={this.onNavigationStateChange}
            loading={{ status: loading || refreshing, showSpinner: !refreshing }}
            ref={node => { this.webview = node }}
          />
          <AudioPlayer
            setUrl={setUrl}
          />
        </SafeAreaView>
      </Fragment>
    )
  }
}

const getData = graphql(gql`
  query GetData {
    url @client
  }
`)

export default compose(
  me,
  login,
  logout,
  getData,
  setUrl,
  setAudio,
  pendingAppSignIn
)(Web)
