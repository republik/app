import React, { Component } from 'react'
import WebView from '../components/WebView'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import { handleEnv } from '../utils/url'
import { pendingAppSignIn } from '../apollo'

class Login extends Component {
  componentWillUnmount () {
    const { refetchPendingSignInRequests } = this.props
    if (refetchPendingSignInRequests) {
      refetchPendingSignInRequests()
    }
  }

  onNavigationStateChange = ({ url, urlObject }) => {
    // close overlay instead of going elsewhere
    if (urlObject.pathname !== '/mitteilung') {
      navigator.goBack()
      return false
    }
    return true
  }

  onSignIn = () => {
    navigator.goBack()
  }

  render () {
    const uri = handleEnv(this.props.navigation.getParam('url'))

    return (
      <SafeAreaView>
        <WebView
          source={{ uri }}
          onMessage={this.onMessage}
          onNavigationStateChange={this.onNavigationStateChange}
          onSignIn={this.onSignIn}
          forceRedirect
        />
      </SafeAreaView>
    )
  }
}

export default pendingAppSignIn(Login)
