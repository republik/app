import React, { Component } from 'react'
import { StyleSheet, Image, View } from 'react-native'
import WebView from '../components/WebView'
import SafeAreaView from '../components/SafeAreaView'
import navigator from '../services/navigation'
import Logo from '../assets/images/logo-title.png'
import { parseURL, handleEnv } from '../utils/url'
import { pendingAppSignIn } from '../apollo'

const HEADER_HEIGHT = 45
const headerStyle = {
  zIndex: 400,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#DADDDC',
  height: HEADER_HEIGHT,
  shadowOpacity: 0,
  elevation: 0
}

const LoginHeader = () => (
  <View style={styles.headerContainer}>
    <Image source={Logo} style={styles.logo} />
  </View>
)

class Login extends Component {
  authSuccessful = false

  componentWillUnmount () {
    const { refetchPendingSignInRequests } = this.props
    if (refetchPendingSignInRequests) {
      refetchPendingSignInRequests()
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
      <SafeAreaView>
        <WebView
          source={{ uri }}
          onMessage={this.onMessage}
          style={styles.container}
          onNavigationStateChange={this.onNavigationStateChange}
          ref={node => { this.webview = node }}
          forceRedirect
        />
      </SafeAreaView>
    )
  }
}

Login.navigationOptions = ({ screenProps }) => ({
  header: undefined,
  headerTitle: <LoginHeader />,
  headerRight: <View />,
  headerStyle
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

export default pendingAppSignIn(Login)
