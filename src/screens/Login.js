import React, { Component } from 'react'
import { StyleSheet, Image, View } from 'react-native'
import WebView from '../components/WebView'
import navigator from '../services/navigation'
import Logo from '../assets/images/logo-title.png'
import { parseURL, handleEnv } from '../utils/url'

const LoginHeader = () => (
  <View style={styles.headerContainer}>
    <Image source={Logo} style={styles.logo} />
  </View>
)

class Login extends Component {
  authSuccessful = false

  onMessage = message => {
    switch (message.type) {
      case 'close-auth-overlay':
        return navigator.goBack()
    }
  }

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url)
    // close overlay instead of going elsewhere
    if (url.path !== '/mitteilung') {
      this.authSuccessful = true
      navigator.goBack()
      return false
    }
    return true
  }

  render () {
    const uri = handleEnv(this.props.navigation.getParam('url'))

    return (
      <WebView
        source={{ uri }}
        onMessage={this.onMessage}
        style={styles.container}
        onNavigationStateChange={this.onNavigationStateChange}
        ref={node => { this.webview = node }}
        forceRedirect
      />
    )
  }
}

Login.navigationOptions = ({ screenProps }) => ({
  headerTitle: <LoginHeader />,
  headerRight: <View />,
  headerStyle: { backgroundColor: '#FFFFFF' }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 150,
    height: 25
  }
})

export default Login
