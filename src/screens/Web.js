import React, { Component, Fragment } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { graphql } from 'react-apollo'
import { compose } from 'recompose'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import {parseURL} from '../utils/url'
import Menu from '../components/Menu'
import WebView from '../components/WebView'
import { me, login, logout, setUrl } from '../apollo'
import { FRONTEND_BASE_URL, OFFERS_PATH } from '../constants'

const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = [/react-js-navigation/]
const PERMITTED_HOSTS = [
  new RegExp(PDF_BASE_URL),
  new RegExp(FRONTEND_BASE_URL),
  /youtube.*\.com/
]

const isExternalURL = ({ host, protocol }) => (
  PERMITTED_HOSTS.every(p => !host.match(p)) &&
  PERMITTED_PROTOCOLS.every(p => !protocol.match(p))
)

class Web extends Component {
  state = { loading: true }

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
    const { data, screenProps, logout } = this.props

    return (
      <Fragment>
        <Menu
          onLogout={() => logout()}
          active={screenProps.menuActive}
        />
        <WebView
          source={{ uri: data.url }}
          style={styles.webView}
          loading={this.state.loading}
          onNetwork={this.onNetwork}
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

export default compose(me, login, logout, getData, setUrl)(Web)
