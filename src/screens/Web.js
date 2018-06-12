import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { graphql } from 'react-apollo'
import { parse } from 'graphql'
import { ApolloLink, execute, makePromise } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import {compose} from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import {parseURL} from '../utils/url'
import Menu from '../components/Menu'
import WebView from '../components/WebView'
import {me, signIn, login, logout} from '../apollo'
import { API_URL, API_WS_URL, FRONTEND_BASE_URL, OFFERS_PATH, DISCUSSIONS_URL } from '../constants'

const RESTRICTED_PATHS = [OFFERS_PATH]

const isExternalURL = ({host, protocol}) => {
  return (host !== parseURL(FRONTEND_BASE_URL).host && !protocol.match(/react-js-navigation/))
}

const hasSubscriptionOperation = ({ query }) => (
  query.definitions.some(
    ({ kind, operation }) =>
      kind === 'OperationDefinition' && operation === 'subscription'
  )
)

const link = ApolloLink.split(
  hasSubscriptionOperation,
  new WebSocketLink({
    uri: API_WS_URL,
    options: {
      reconnect: true,
      timeout: 50000
    }
  }),
  new HttpLink({ uri: API_URL })
)

class Web extends Component {
  constructor (props) {
    super(props)

    this.state = { loading: true }
  }

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
      case 'start':
        return this.handleGraphQLSubscription(message)
      default:
        console.log(message)
        console.warn(`Unhandled message of type: ${message.type}`)
    }
  }

  handleGraphQLMessages = (message) => {
    const operation = {
      query: message.data.payload.query,
      operationName: message.data.payload.operationName,
      variables: message.data.payload.variables,
      extensions: message.data.payload.extensions
    }

    return makePromise(execute(link, operation)).then(data => {
      this.webview.instance.postMessage(JSON.stringify({
        id: message.data.id,
        ...data
      }))
    })
  }

  handleGraphQLSubscription = (message) => {
    switch (message.type) {
      case 'start':
        const query = typeof message.payload.query === 'string'
          ? parse(message.payload.query)
          : message.payload.query

        const operation = {
          query,
          operationName: message.payload.operationName,
          variables: message.payload.variables,
          extensions: message.payload.extensions
        }

        execute(link, operation).subscribe({
          next: data => {
            this.webview.instance.postMessage(JSON.stringify({
              id: message.id,
              type: 'data',
              payload: data
            }))
          }
        })
    }
  }

  handleSessionMessages = (message) => {
    const {me, login, logout} = this.props

    if (message.data && !me) {
      login({
        variables: {
          user: message.data
        }
      })
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
    const { screenProps, logout } = this.props

    return (
      <Fragment>
        <Menu
          onLogout={() => logout()}
          active={screenProps.menuActive}
        />
        <WebView
          ref={node => { this.webview = node }}
          source={{ uri: DISCUSSIONS_URL }}
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
