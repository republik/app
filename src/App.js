import React, { Component } from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import CookieManager from 'react-native-cookies'
import { compose } from 'react-apollo'
import Web from './screens/Web'
import Header from './components/Header'
import codePush from './services/codePush'
import deepLinking from './services/deepLinking'
import pushNotifications from './services/pushNotifications'
import withApollo from './apollo'
import { FRONTEND_BASE_URL, CURTAIN_BACKDOOR_PATH } from './constants'

const Router = createStackNavigator({
  Web: { screen: Web }
}, {
  initialRouteName: 'Web',
  navigationOptions: ({ screenProps }) => ({
    headerTitle: <Header {...screenProps} />,
    headerStyle: { backgroundColor: '#FFFFFF' }
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

    const { askForNotificationPermission } = this.props

    return (
      <Router screenProps={{
        persistor: this.props.persistor,
        onLoadEnd: this.hideSplashScreen,
        askForNotificationPermission
      }} />
    )
  }
}

export default compose(
  withApollo,
  codePush,
  deepLinking,
  pushNotifications
)(App)
