import React, { Component } from 'react'
import { StyleSheet, Linking, ScrollView, RefreshControl } from 'react-native'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import WebView from '../components/WebView'
import { FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'
import { me, login, logout, setUrl, setArticle, enableSecondaryMenu, closeMenu, withMenuState } from '../apollo'

const RELOAD_OFFSET_HEIGHT = 15
const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']
const PERMITTED_HOSTS = [
  parseURL(FRONTEND_BASE_URL).host,
  'youtube.com',
  'youtube-nocookie.com',
  'player.vimeo.com'
]

const isExternalURL = ({ host, protocol }) => (
  PERMITTED_HOSTS.every(p => !host.includes(p)) &&
  PERMITTED_PROTOCOLS.every(p => !protocol.includes(p))
)

let visible = true

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      refreshing: false,
      refreshEnabled: true
    }
  }

  componentDidMount () {
    setInterval(() => {
      visible = !visible
      this.props.navigation.setParams({ headerVisible: visible })
    }, 2000)
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

    if (operations.includes('me')) {
      if (data.data.me && !me) {
        await login({
          variables: {
            user: data.data.me
          }
        })

        screenProps.getNotificationsToken()
      }

      if (!data.data.me && me) {
        await logout()
      }
    }
  }

  onRefresh = () => {
    this.setState({ refreshing: true })
    this.webview.reload()
  }

  onWebViewScroll = ({ y }) => {
    this.setState({ refreshEnabled: y < RELOAD_OFFSET_HEIGHT })
  }

  render () {
    const { data } = this.props
    const { loading, refreshing, refreshEnabled } = this.state

    return (
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
          loading={{ status: loading || refreshing, showSpinner: !refreshing }}
          ref={node => { this.webview = node }}
        />
      </ScrollView>
    )
  }
}

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
  setArticle,
  withMenuState,
  enableSecondaryMenu,
  closeMenu
)(Web)
