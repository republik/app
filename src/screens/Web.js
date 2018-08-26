import React, { Component, Fragment } from 'react'
import {
  StyleSheet, Linking, ScrollView, RefreshControl, AppState, NetInfo, Platform
} from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import WebView from '../components/WebView'
import AudioPlayer from '../components/AudioPlayer'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import { FRONTEND_BASE_URL, OFFERS_PATH, LOGIN_PATH } from '../constants'
import {
  me,
  login,
  logout,
  setUrl,
  setAudio,
  withAudio,
  pendingAppSignIn
} from '../apollo'
import mkDebug from '../utils/debug'

const debug = mkDebug('Web')

const RELOAD_OFFSET_HEIGHT = 5
const RELOAD_TIME_THRESHOLD = 60 * 60 * 1000 // 1hr
const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']

const FRONTEND_HOST = parseURL(FRONTEND_BASE_URL).host
const isExternalURL = ({ host, protocol }) => (
  FRONTEND_HOST !== host &&
  !PERMITTED_PROTOCOLS.includes(protocol)
)

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      refreshing: false,
      refreshEnabled: true
    }

    this.lastScrollY = 0
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
    if (!this.props.me) {
      return
    }
    const { data } = await this.props.refetchPendingSignInRequests()
    if (data.pendingAppSignIn) {
      navigator.navigate('Login', { url: data.pendingAppSignIn.verificationUrl })
    }
  }

  setLoading = debounce(value => {
    this.setState({ loading: value })
  }, 150)

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url)

    // If user goes to a external or restricted path, we open it in system browser
    // and prevent webview to go there.
    if (isExternalURL(url) || RESTRICTED_PATHS.includes(url.path)) {
      Linking.openURL(data.url)
      return false
    }

    this.props.setUrl({ variables: { url: data.url } })
    this.reloadIfNeccesary()

    return true
  }

  reloadIfNeccesary = async () => {
    const url = parseURL(this.props.data.url)
    const isConnected = await NetInfo.isConnected.fetch()

    if (
      isConnected &&
      this.shouldReload &&
      url.path !== LOGIN_PATH
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
  }

  onLoadEnd = () => {
    debug('onLoadEnd')

    this.setLoading(false)

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
      case 'show-audio-player':
        return this.showAudioPlayer()
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

  showAudioPlayer = () => {
    this.props.setAudio({ variables: { audio: this.props.article.audioSource } })
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

  onWebViewScroll = ({ y }) => {
    const positiveYScroll = Math.max(y, 0)
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
    const { me, data, menuActive, audio, playbackState, article, setUrl, navigation } = this.props
    const { loading, refreshing, refreshEnabled, fullscreen } = this.state
    const articlePath = article ? article.path : null
    const articleTitle = article ? article.title : ''

    return (
      <Fragment>
        <SafeAreaView fullscreen={fullscreen}>
          <ScrollView
            contentContainerStyle={styles.container}
            scrollEnabled={!refreshing}
            refreshControl={
              <RefreshControl
                onRefresh={this.onRefresh}
                refreshing={this.state.refreshing}
                enabled={refreshEnabled}
              />
            }
          >
            <WebView
              source={{ uri: data.url }}
              onNetwork={this.onNetwork}
              onMessage={this.onMessage}
              onLoadEnd={this.onLoadEnd}
              onLoadStart={this.onLoadStart}
              onScroll={this.onWebViewScroll}
              onNavigationStateChange={this.onNavigationStateChange}
              loading={{ status: loading || refreshing, showSpinner: !refreshing }}
              ref={node => { this.webview = node }}
            />
          </ScrollView>
          <AudioPlayer
            url={audio}
            setUrl={setUrl}
            title={articleTitle}
            articlePath={articlePath}
            playbackState={playbackState}
          />
        </SafeAreaView>
      </Fragment>
    )
  }
}

Web.navigationOptions = ({ screenProps }) => ({
  header: null
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100
  }
})

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
  withAudio,
  pendingAppSignIn
)(Web)
