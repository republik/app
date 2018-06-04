import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking } from 'react-native'
import Config from 'react-native-config'
import { graphql } from 'react-apollo'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import Menu from '../components/Menu'
import WebView from '../components/WebView'
import { me, login, logout } from '../apollo'
import { FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'

const RESTRICTED_PATHS = [
  OFFERS_PATH
]

const isExternalURL = ({ host, protocol }) => {
  return (
    host !== parseURL(FRONTEND_BASE_URL).host &&
    !protocol.match(/react-js-navigation/)
  )
}

class Web extends Component {
  state = { loading: true }

  setLoading = debounce(value => {
    this.setState({ loading: value })
  }, 150)

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url)

    // External URLs will natively be opened in system browser.
    // No need to call Linking.openURL. Just prevent the webview to go there.
    if (isExternalURL(url)) {
      return false
    }

    // If user goes to a restricted path, we open it in system browser
    // and prevent webview to go there.
    if (RESTRICTED_PATHS.includes(url.path)) {
      Linking.openURL(data.url)
      return false
    }

    return true
  }

  onMessage = (message) => {
    const { me, login, logout } = this.props

    if (message.type === 'session') {
      if (message.data && !me) {
        login({ variables: { user: message.data } })
      }

      if (!message.data && me) {
        logout()
      }
    }
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
    const { data, screenProps } = this.props
    const headers = { Authorization: `Basic ${Config.FRONTEND_AUTH_TOKEN}` }

    return (
      <Fragment>
        <Menu active={screenProps.menuActive} />
        <WebView
          source={{uri: data.url, headers}}
          style={styles.webView}
          loading={this.state.loading}
          onMessage={this.onMessage}
          onLoadEnd={this.onLoadEnd}
          onLoadStart={this.onLoadStart}
          webViewWillTransition={this.webViewWillTransition}
          onNavigationStateChange={this.onNavigationStateChange}
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

export default compose(me, login, logout, getData)(Web)
