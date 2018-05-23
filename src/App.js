import React, { Component } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { SwitchNavigator } from 'react-navigation';
import { compose } from 'recompose';
import Web from './screens/Web';
import withApollo from './services/apollo';
import codePush from './services/codePush';
import deepLinking from './services/deepLinking';
import pushNotifications from './services/pushNotifications';

const Router = SwitchNavigator({
  Web: { screen: Web }
});

class App extends Component {
  hideSplashScreen = () => {
    SplashScreen.hide();
  }

  render() {
    return (
      <Router screenProps={{ onLoadEnd: this.hideSplashScreen }} />
    );
  }
}

export default compose(
  withApollo,
  codePush,
  deepLinking,
  pushNotifications,
)(App);
