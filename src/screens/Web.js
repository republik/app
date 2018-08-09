import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking, ScrollView, RefreshControl, AppState, NetInfo, Platform, Share } from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import Header from '../components/Header'
import Subheader from '../components/Subheader'
import WebView from '../components/WebView'
import AudioPlayer from '../components/AudioPlayer'
import navigator from '../services/navigation'
import { FRONTEND_BASE_URL, OFFERS_PATH, LOGIN_PATH } from '../constants'
import {
  me,
  login,
  logout,
  setUrl,
  setAudio,
  closeMenu,
  withAudio,
  setArticle,
  withMenuState,
  pendingAppSignIn,
  withCurrentArticle,
  enableSecondaryMenu
} from '../apollo'

const RELOAD_OFFSET_HEIGHT = 5
const RELOAD_TIME_THRESHOLD = 60 * 60 * 1000 // 1hr
const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']
const VIDEO_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'player.vimeo.com'
]

const isVideoURL = ({ host }) => (
  VIDEO_HOSTS.includes(host)
)

const isExternalURL = ({ host, protocol }) => (
  !isVideoURL({ host }) &&
  parseURL(FRONTEND_BASE_URL).host !== host &&
  !PERMITTED_PROTOCOLS.includes(protocol)
)

let WEBVIEW_INSTANCE = null

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      refreshing: false,
      refreshEnabled: true,
      subheaderVisible: true
    }

    this.lastScrollY = 0
    this.shouldReload = false
    this.lastActiveDate = null
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.goToLoginIfPendingRequest()
  }

  componentWillReceiveProps (nextProps) {
    // Toggle primary menu on webview
    if (!this.props.menuActive && nextProps.menuActive) {
      WEBVIEW_INSTANCE.postMessage({ type: 'open-menu' })
    }

    if (this.props.menuActive && !nextProps.menuActive) {
      WEBVIEW_INSTANCE.postMessage({ type: 'close-menu' })
    }

    // Toggle secondary menu on webview
    if (!this.props.secondaryMenuActive && nextProps.secondaryMenuActive) {
      WEBVIEW_INSTANCE.postMessage({ type: 'open-secondary-menu' })
    }

    if (this.props.secondaryMenuActive && !nextProps.secondaryMenuActive) {
      WEBVIEW_INSTANCE.postMessage({ type: 'close-secondary-menu' })
    }
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
    const { data } = await this.props.refetchPendingSignInRequests()
    if (data.pendingAppSignIn) {
      navigator.navigate('Login', { url: data.pendingAppSignIn.verificationUrl })
    }
  }

  setLoading = debounce(value => {
    this.setState({ loading: value })
  }, 150)

  enableSecondaryMenuState = debounce(value => {
    this.props.enableSecondaryMenu({ variables: { open: value } })
  }, 150)

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url)

    // If user goes to a external or restricted path, we open it in system browser
    // and prevent webview to go there.
    if (isExternalURL(url) || RESTRICTED_PATHS.includes(url.path)) {
      Linking.openURL(data.url)
      return false
    }

    // If video tries to open, prevent webview navigation
    if (isVideoURL(url)) {
      return false
    }

    this.props.closeMenu()
    this.enableSecondaryMenuState(false)
    this.setState({ subheaderVisible: true })
    this.props.setUrl({ variables: { url: data.url } })
    this.props.navigation.setParams({ headerVisible: true })
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
      WEBVIEW_INSTANCE.reload()
      this.shouldReload = false
    }
  }

  onLoadStart = () => {
    if (this.props.screenProps.onLoadStart) {
      this.props.screenProps.onLoadStart()
    }
  }

  onLoadEnd = () => {
    this.setLoading(false)

    if (this.state.refreshing) {
      this.setState({ refreshing: false })
      WEBVIEW_INSTANCE.postMessage({ type: 'scroll-to-top' })
    }

    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd()
    }
  }

  onMessage = message => {
    switch (message.type) {
      case 'initial-state':
        return this.loadInitialState(message.payload)
      case 'share':
        return this.shareCurrentArticle()
      case 'show-audio-player':
        return this.showAudioPlayer()
      case 'article-opened':
        return this.props.setArticle({ variables: { article: message.payload } })
      case 'article-closed':
        return this.props.setArticle({ variables: { article: null } })
      case 'gallery-opened':
        return this.props.navigation.setParams({ headerVisible: false })
      case 'gallery-closed':
        return this.props.navigation.setParams({ headerVisible: true })
      case 'close-menu':
        return this.props.closeMenu()
      case 'show-secondary-nav':
        return this.enableSecondaryMenuState(true)
      case 'hide-secondary-nav':
        return this.enableSecondaryMenuState(false)
      default:
        console.log(message)
        console.warn(`Unhandled message of type: ${message.type}`)
    }
  }

  loadInitialState = (payload) => {
    const { me } = this.props

    if (payload.me && !me) {
      return this.loginUser(payload.me, { reload: false })
    }

    if (!payload.me && me) {
      return this.logoutUser({ reload: false })
    }
  }

  shareCurrentArticle = () => {
    const { article } = this.props
    const url = `${FRONTEND_BASE_URL}${article.path}`

    Share.share({
      url,
      message: url,
      title: article.title,
      subject: article.title,
      dialogTitle: article.title
    })
  }

  showAudioPlayer = () => {
    this.props.setAudio({ variables: { audio: this.props.article.audioSource } })
  }

  onNetwork = async ({ query, data }) => {
    const { me, login } = this.props
    const { definitions } = query
    const operations = definitions.map(definition => definition.name && definition.name.value)

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
    WEBVIEW_INSTANCE.reload()
  }

  onWebViewScroll = ({ y }) => {
    const positiveYScroll = Math.max(y, 0)

    this.setState({
      refreshEnabled: positiveYScroll < RELOAD_OFFSET_HEIGHT,
      subheaderVisible: positiveYScroll <= 45 || positiveYScroll < this.lastScrollY
    }, () => {
      this.lastScrollY = positiveYScroll
    })
  }

  loginUser = async (user, { reload = true } = {}) => {
    this.setState({ subheaderVisible: true }, async () => {
      await this.props.login({ variables: { user } })

      // Force webview reload to update request cookies on iOS
      if (reload && Platform.OS === 'ios') WEBVIEW_INSTANCE.reload()

      this.props.screenProps.getNotificationsToken()
    })
  }

  logoutUser = async ({ reload = true } = {}) => {
    await this.props.logout()
    if (reload && Platform.OS === 'ios') WEBVIEW_INSTANCE.reload()
  }

  render () {
    const { me, data, menuActive, audio, playbackState, article, setUrl, navigation } = this.props
    const { loading, refreshing, refreshEnabled } = this.state
    const articlePath = article ? article.path : null
    const articleTitle = article ? article.title : ''
    const subheaderVisible = me && this.state.subheaderVisible
    const headerVisible = navigation.getParam('headerVisible', true)

    return (
      <Fragment>
        <Subheader
          setUrl={setUrl}
          currentUrl={data.url}
          borderColor={article && article.color}
          visible={subheaderVisible && !menuActive && headerVisible}
        />
        <ScrollView
          style={{ marginTop: refreshing && subheaderVisible ? Subheader.HEIGHT : 0 }}
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
            webViewWillTransition={this.webViewWillTransition}
            onNavigationStateChange={this.onNavigationStateChange}
            loading={{ status: loading || refreshing, showSpinner: !refreshing }}
            ref={node => { WEBVIEW_INSTANCE = node }}
          />
        </ScrollView>
        <AudioPlayer
          url={audio}
          setUrl={setUrl}
          title={articleTitle}
          articlePath={articlePath}
          playbackState={playbackState}
        />
      </Fragment>
    )
  }
}

Web.navigationOptions = ({ screenProps }) => ({
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTitle: (
    <Header
      {...screenProps}
      onBackClick={() => { WEBVIEW_INSTANCE.goBack() }}
      onPDFClick={() => { WEBVIEW_INSTANCE.postMessage({ type: 'toggle-pdf' }) }}
      onLogoClick={() => { WEBVIEW_INSTANCE.postMessage({ type: 'scroll-to-top' }) }}
    />
  )
})

var styles = StyleSheet.create({
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
  closeMenu,
  withAudio,
  setArticle,
  withMenuState,
  pendingAppSignIn,
  withCurrentArticle,
  enableSecondaryMenu
)(Web)
