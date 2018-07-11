import React, { Component } from 'react'
import { StyleSheet, Image, View } from 'react-native'
import { compose } from 'react-apollo'
import WebView from '../components/WebView'
import { handleEnv } from '../utils/url'
import Logo from '../assets/images/logo-title.png'

const LoginHeader = () => (
  <View style={styles.headerContainer}>
    <Image source={Logo} style={styles.logo} />
  </View>
)

class Login extends Component {
  render () {
    const uri = handleEnv(this.props.navigation.getParam('url'))

    return (
      <WebView
        style={styles.container}
        source={{ uri }}
        ref={node => { this.webview = node }}
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

export default compose(
)(Login)
