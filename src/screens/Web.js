import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { graphql } from 'react-apollo'
import { createApolloFetch } from 'apollo-fetch'
import { print } from 'graphql/language/printer'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { parseURL } from '../utils/url'
import Menu from '../components/Menu'
import WebView from '../components/WebView'
import { me, signIn, login, logout } from '../apollo'
import { API_URL, FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'

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
  apolloFetch = createApolloFetch({ uri: API_URL })

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
    switch (message.type) {
      case 'session':
        return this.handleSessionMessages(message)
      case 'graphql':
        return this.handleGraphQLMessages(message)
      default:
        console.warn(`Unhandled message of type: ${message.type}`)
    }
  }

  handleGraphQLMessages = (message) => {
    const request = {
      ...message.data,
      query: print(message.data.query)
    }

    // Resolves call app side, and returns the response to web view
    return this.apolloFetch(request).then(data => {
      this.webview.instance.postMessage(JSON.stringify(data))
    })
  }

  handleSessionMessages = (message) => {
    const { me, login, logout } = this.props

    if (message.data && !me) {
      login({ variables: { user: message.data } })
    }

    if (!message.data && me) {
      logout()
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
    const { data, screenProps, logout } = this.props

    return (
      <Fragment>
        <Menu
          onLogout={() => logout()}
          active={screenProps.menuActive}
        />
        <WebView
          ref={node => { this.webview = node }}
          source={{uri: data.url}}
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

export default compose(me, login, signIn, logout, getData)(Web)
