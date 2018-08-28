import React, { Component } from 'react'
import { parse } from 'url'
import WebView from '../components/WebView'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import { handleEnv } from '../utils/url'
import { pendingAppSignIn } from '../apollo'


class Login extends Component {
  authSuccessful = false

  componentWillUnmount () {
    const { refetchPendingSignInRequests } = this.props
    if (refetchPendingSignInRequests) {
      refetchPendingSignInRequests()
    }
  }

  onNavigationStateChange = (data) => {
    const url = parse(data.url)
    // close overlay instead of going elsewhere
    if (url.pathname !== '/mitteilung') {
      this.authSuccessful = true
      navigator.goBack()
      return false
    }
    return true
  }

  render () {
    const uri = handleEnv(this.props.navigation.getParam('url'))

    return (
      <SafeAreaView>
        <WebView
          source={{ uri }}
          onMessage={this.onMessage}
          onNavigationStateChange={this.onNavigationStateChange}
          ref={node => { this.webview = node }}
          forceRedirect
        />
      </SafeAreaView>
    )
  }
}

Login.navigationOptions = ({ screenProps }) => ({
  header: null
})

export default pendingAppSignIn(Login)
