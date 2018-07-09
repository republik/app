import React, { Component } from 'react'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import { compose } from 'react-apollo'
import Web from './screens/Web'
import Login from './screens/Login'
import cookies from './services/cookies'
import settings from './services/settings'
import codePush from './services/codePush'
import deepLinking from './services/deepLinking'
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
  navigationOptions: ({ screenProps }) => ({
    headerTintColor: '#000000',
    headerStyle: { backgroundColor: '#FFFFFF' }
  })
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
      <Router screenProps={{
        persistor: this.props.persistor,
        onLoadEnd: this.hideSplashScreen,
        getNotificationsToken
      }} />
    )
  }
}

export default compose(
  withApollo,
  codePush,
  deepLinking,
  pushNotifications,
  cookies,
  settings
)(App)
