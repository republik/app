import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking, AppState } from 'react-native'
import { graphql } from 'react-apollo'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import WebView from '../components/WebView'
import { FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'
import { me, login, logout, setUrl, setArticle, enableSecondaryMenu, closeMenu, withMenuState } from '../apollo'

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

class Web extends Component {
  state = { loading: true }
  lastUrl = null

  componentDidMount () {
    AppState.addEventListener('change', this.onAppStateChange)
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.onAppStateChange)
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

    this.lastUrl = data.url
    this.props.closeMenu()
    this.enableSecondaryMenuState(false)

    return true
  }

  onLoadStart = () => {
    if (this.props.screenProps.onLoadStart) {
      this.props.screenProps.onLoadStart()
    }
  }

  onLoadEnd = () => {
    this.setLoading(false)

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
    const { me, login, logout } = this.props
    const { definitions } = query
    const operations = definitions.map(definition => definition.name.value)

    if (operations.includes('me')) {
      if (data.data.me && !me) {
        await login({
          variables: {
            user: data.data.me
          }
        })
      }

      if (!data.data.me && me) {
        await logout()
      }
    }
  }

  onAppStateChange = nextState => {
    // Persist cache manually with correct url once app is closed
    if (nextState.match(/inactive|background/)) {
      this.props.setUrl({ variables: { url: this.lastUrl } }).then(() => {
        this.props.screenProps.persistor.persist()
      })
    }
  }

  render () {
    const { data } = this.props

    return (
      <Fragment>
        <WebView
          source={{ uri: data.url }}
          style={styles.webView}
          loading={this.state.loading}
          onNetwork={this.onNetwork}
          onMessage={this.onMessage}
          onLoadEnd={this.onLoadEnd}
          onLoadStart={this.onLoadStart}
          webViewWillTransition={this.webViewWillTransition}
          onNavigationStateChange={this.onNavigationStateChange}
          ref={node => { this.webview = node }}
        />
      </Fragment>
    )
  }
}

var styles = StyleSheet.create({
  webView: {
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
