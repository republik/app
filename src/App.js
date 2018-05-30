import React, { Component } from 'react'
import SplashScreen from 'react-native-splash-screen'
import { createStackNavigator } from 'react-navigation'
import { compose } from 'recompose'
import Web from './screens/Web'
import TitleLogo from './components/TitleLogo'
import TitleButton from './components/TitleButton'
import codePush from './services/codePush'
import deepLinking from './services/deepLinking'
import pushNotifications from './services/pushNotifications'
import withApollo, { getMenuState, toggleMenu } from './apollo'

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
  hideSplashScreen = () => {
    SplashScreen.hide()
  }

  render () {
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
