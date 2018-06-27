import React, { Component } from 'react'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import { compose } from 'recompose'
import Web from './screens/Web'
import Header from './components/Header'
import codePush from './services/codePush'
import cookies from './services/cookies'
import deepLinking from './services/deepLinking'
import pushNotifications from './services/pushNotifications'
import settings from './services/settings'
import withApollo from './apollo'

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
  }

  hideSplashScreen = () => {
    SplashScreen.hide()
  }

  render () {
    if (!this.state.cacheLoaded) return null

    return (
      <Router screenProps={{
        persistor: this.props.persistor,
        onLoadEnd: this.hideSplashScreen
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
