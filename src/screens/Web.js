import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { graphql } from 'react-apollo'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import {parseURL} from '../utils/url'
import WebView from '../components/WebView'
import { me, login, logout, setUrl, setArticle, closeMenu } from '../apollo'
import { PDF_BASE_URL, FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'

const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']
const PERMITTED_HOSTS = [
  PDF_BASE_URL,
  FRONTEND_BASE_URL,
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

  componentWillReceiveProps (nextProps) {
    if (!this.props.screenProps.menuActive && nextProps.screenProps.menuActive) {
      this.webview.postMessage({ type: 'open-menu' })
    }

    if (this.props.screenProps.menuActive && !nextProps.screenProps.menuActive) {
      this.webview.postMessage({ type: 'close-menu' })
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

    this.props.closeMenu()
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

export default compose(me, login, logout, getData, setUrl, setArticle, closeMenu)(Web)
