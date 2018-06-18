import React, { Component } from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import CookieManager from 'react-native-cookies'
import { compose } from 'recompose'
import Web from './screens/Web'
import TitleLogo from './components/TitleLogo'
import TitleButton from './components/TitleButton'
import codePush from './services/codePush'
import deepLinking from './services/deepLinking'
import pushNotifications from './services/pushNotifications'
import withApollo, { getMenuState, toggleMenu } from './apollo'
import { FRONTEND_BASE_URL, CURTAIN_BACKDOOR_PATH } from './constants'

const Router = createStackNavigator({
  Web: { screen: Web }
}, {
  initialRouteName: 'Web',
  navigationOptions: ({ screenProps }) => ({
    headerTitle: <TitleLogo />,
    headerLeft: (
      <TitleButton
        side="left"
        type="profile"
        onPress={screenProps.toggleMenu}
      />
    ),
    headerRight: (
      <TitleButton
        side="right"
        type="hamburger"
        onPress={screenProps.toggleMenu}
      />
    ),
    headerStyle: {
      backgroundColor: '#FFFFFF'
    }
  })
})

class App extends Component {
  state = { cacheLoaded: false }

  componentDidMount () {
    this.props.persistor.restore().then(() => {
      this.setState({ cacheLoaded: true })
    })

    if (CURTAIN_BACKDOOR_PATH) {
      let cookies = `OpenSesame=${encodeURIComponent(CURTAIN_BACKDOOR_PATH)}; Path=/; Expires=Thu, 01 Jan 2030 00:00:00 GMT; HttpOnly`

      if (Platform.OS === 'ios') {
        cookies = { 'Set-Cookie': cookies }
      }

      CookieManager.setFromResponse(FRONTEND_BASE_URL, cookies)
    }
  }

  hideSplashScreen = () => {
    SplashScreen.hide()
  }

  render () {
    if (!this.state.cacheLoaded) return null

    return (
      <Router screenProps={{
        onLoadEnd: this.hideSplashScreen,
        menuActive: this.props.menuActive,
        toggleMenu: this.props.toggleMenu
      }} />
    )
  }
}

export default compose(
  withApollo,
  codePush,
  deepLinking,
  pushNotifications,
  getMenuState,
  toggleMenu
)(App)
