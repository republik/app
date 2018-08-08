import React, { Component } from 'react'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import { compose } from 'react-apollo'
import Web from './screens/Web'
import Login from './screens/Login'
import cookies from './services/cookies'
import settings from './services/settings'
import navigator from './services/navigation'
import deepLinking from './services/deepLinking'
import ota from './services/ota'
import pushNotifications from './services/pushNotifications'
import withApollo from './apollo'

const Router = createStackNavigator({
  Web: { screen: Web },
  Login: {
    screen: Login,
    path: 'login/:url'
  }
}, {
  mode: 'modal',
  initialRouteName: 'Web',
  navigationOptions: ({ screenProps, navigation }) => {
    const params = navigation.state.params || {}
    const headerVisible = params.headerVisible === undefined ? true : params.headerVisible

    return {
      headerTintColor: '#000000',
      headerStyle: { backgroundColor: '#FF0000' },
      header: headerVisible ? undefined : null
    }
  }
})

class App extends Component {
  state = { cacheLoaded: false }

  componentDidMount () {
    this.props.persistor.restore().then(() => {
      this.setState({ cacheLoaded: true })
    })
  }

  hideSplashScreen = () => {
    SplashScreen.hide()
  }

  render () {
    if (!this.state.cacheLoaded) return null

    const { getNotificationsToken } = this.props

    return (
      <Router
        ref={navigatorRef => navigator.setContainer(navigatorRef)}
        screenProps={{
          persistor: this.props.persistor,
          onLoadEnd: this.hideSplashScreen,
          checkForUpdates: this.props.checkForUpdates,
          getNotificationsToken
        }}
      />
    )
  }
}

export default compose(
  withApollo,
  ota,
  deepLinking,
  pushNotifications,
  cookies,
  settings
)(App)
