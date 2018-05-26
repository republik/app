import React, { Component } from 'react'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import { compose } from 'recompose'
import Web from './screens/Web'
import TitleLogo from './components/TitleLogo'
import TitleButton from './components/TitleButton'
import withApollo from './services/apollo'
import codePush from './services/codePush'
import deepLinking from './services/deepLinking'
import pushNotifications from './services/pushNotifications'

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
  state = { menuActive: false };

  hideSplashScreen = () => {
    SplashScreen.hide()
  }

  toggleMenu = () => {
    this.setState(state => ({ menuActive: !state.menuActive }))
  }

  render () {
    return (
      <Router screenProps={{
        onLoadEnd: this.hideSplashScreen,
        menuActive: this.state.menuActive,
        toggleMenu: this.toggleMenu
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
