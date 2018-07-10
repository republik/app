import React, { Component } from 'react'
import { StyleSheet, Image } from 'react-native'
import { compose } from 'react-apollo'
import WebView from '../components/WebView'
import Logo from '../assets/images/logo-title.png'

class Login extends Component {
  render () {
    const uri = this.props.navigation.getParam('url')

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
  headerTitle: <Image source={Logo} style={styles.logo} />,
  headerStyle: { backgroundColor: '#FFFFFF' }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100
  },
  logo: {
    width: 150,
    height: 25
  }
})

export default compose(
)(Login)
