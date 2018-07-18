import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking, ScrollView, RefreshControl, AppState, NetInfo } from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import Header from '../components/Header'
import WebView from '../components/WebView'
import AudioPlayer from '../components/AudioPlayer'
import { FRONTEND_BASE_URL, OFFERS_PATH, LOGIN_PATH } from '../constants'
import {
  me,
  login,
  logout,
  setUrl,
  setArticle,
  enableSecondaryMenu,
  closeMenu,
  withMenuState,
  withAudio,
  withCurrentArticle
} from '../apollo'

const RELOAD_OFFSET_HEIGHT = 5
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

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      refreshing: false,
      refreshEnabled: true,
      appState: AppState.currentState
    }

    // On android file chooser makes app go to background, causing an
    // unwanted reload on the page (due to handleAppStateChange)
    // By this flag we handle if the webview should reload depending if
    // the native file chooser was opened or not
    this.fileChooserOpen = false
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)
  }

  componentWillReceiveProps (nextProps) {
    // Toggle primary menu on webview
    if (!this.props.menuActive && nextProps.menuActive) {
      this.webview.postMessage({ type: 'open-menu' })
    }

    if (this.props.menuActive && !nextProps.menuActive) {
      this.webview.postMessage({ type: 'close-menu' })
    }

    // Toggle secondary menu on webview
    if (!this.props.secondaryMenuActive && nextProps.secondaryMenuActive) {
      this.webview.postMessage({ type: 'open-secondary-menu' })
    }

    if (this.props.secondaryMenuActive && !nextProps.secondaryMenuActive) {
      this.webview.postMessage({ type: 'close-secondary-menu' })
    }
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  handleAppStateChange = async (nextAppState) => {
    const url = parseURL(this.props.data.url)
    const isConnected = await NetInfo.isConnected.fetch()

    if (
      isConnected &&
      nextAppState === 'active' &&
      url.path !== LOGIN_PATH &&
      this.state.appState.match(/inactive|background/)
    ) {
      if (!this.fileChooserOpen) {
        this.setState({ loading: true })
        this.webview.reload()
      }

      this.fileChooserOpen = false
    }

    this.setState({ appState: nextAppState })
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
    this.props.setUrl({ variables: { url: data.url } })

    return true
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
      this.webview.postMessage({ type: 'scroll-to-top' })
    }

    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd()
    }
  }

  onMessage = message => {
    switch (message.type) {
      case 'article-opened':
        return this.props.setArticle({ variables: { article: message.payload } })
      case 'article-closed':
        return this.props.setArticle({ variables: { article: null } })
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

  onNetwork = async ({ query, data }) => {
    const { me, login, logout, screenProps } = this.props
    const { definitions } = query
    const operations = definitions.map(definition => definition.name && definition.name.value)

    // User logs in
    if (operations.includes('me')) {
      if (data.data.me && !me) {
        await login({
          variables: {
            user: data.data.me
          }
        })

        screenProps.getNotificationsToken()
      }

      // User got unauthenticated
      if (!data.data.me && me) {
        await logout()
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

  // Android only
  // Prevent webview to reload after closing file chooser
  onFileChooserOpen = () => {
    this.fileChooserOpen = true
  }

  onRefresh = () => {
    this.setState({ refreshing: true })
    this.webview.reload()
  }

  onWebViewScroll = ({ y }) => {
    this.setState({ refreshEnabled: y < RELOAD_OFFSET_HEIGHT })
  }

  render () {
    const { data, audio, playbackState, article } = this.props
    const { loading, refreshing, refreshEnabled } = this.state
    const audioTitle = article ? article.title : ''

    return (
      <Fragment>
        <ScrollView
          contentContainerStyle={styles.container}
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
            onFileChooserOpen={this.onFileChooserOpen} // Android only
            loading={{ status: loading || refreshing, showSpinner: !refreshing }}
            ref={node => { this.webview = node }}
          />
        </ScrollView>
        <AudioPlayer
          url={audio}
          title={audioTitle}
          playbackState={playbackState}
        />
      </Fragment>
    )
  }
}

Web.navigationOptions = ({ screenProps }) => ({
  headerTitle: <Header {...screenProps} />,
  headerStyle: { backgroundColor: '#FFFFFF' }
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
  withAudio,
  setArticle,
  withMenuState,
  withCurrentArticle,
  enableSecondaryMenu,
  closeMenu
)(Web)
