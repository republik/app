import React, { Component } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { graphql } from 'react-apollo'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import WebView from '../components/WebView'
import { FRONTEND_BASE_URL, FEED_URL, OFFERS_PATH, NOTIFICATIONS_PATH } from '../constants'

const RESTRICTED_PATHS = [
  OFFERS_PATH
]

const isExternalURL = ({ host }) => {
  return host !== parseURL(FRONTEND_BASE_URL).host
}

class Web extends Component {
  state = { loading: true }

  setLoading = debounce(value => {
    this.setState({ loading: value })
  }, 150)

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url)

    // External URLs will natively be opened in system browser.
    // No need to call Linking.openURL. Just preven the webview to go there.
    if (isExternalURL(url)) {
      return false
    }

    // If user goes to a restricted path, we open it in system browser
    // and prevent webview to go there.
    if (RESTRICTED_PATHS.includes(url.path)) {
      Linking.openURL(data.url)
      return false
    }

    // Handle auth flow and redirect to feed after login
    if (url.path === NOTIFICATIONS_PATH) {
      if (url.params.type === 'email-confirmed') {
        this.setLoading(false)
        this.props.setUrl({ variables: { url: FEED_URL } })
      } else {
        this.setLoading(true)
      }
      return true
    }

    // Update global URL to keep record of current path
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

  render () {
    const { data } = this.props

    return (
      <WebView
        style={styles.webView}
        source={{uri: data.url}}
        loading={this.state.loading}
        onLoadEnd={this.onLoadEnd}
        onLoadStart={this.onLoadStart}
        onNavigationStateChange={this.onNavigationStateChange}
      />
    )
  }
}

var styles = StyleSheet.create({
  webView: {
    flex: 1
  }
})

const getData = graphql(gql`
  query GetData {
    url @client
    loggedIn @client
  }
`)

const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' })

export default compose(getData, setUrl)(Web)
