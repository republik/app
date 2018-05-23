import React, { Component } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { createStackNavigator } from 'react-navigation';
import CookieManager from 'react-native-cookies';
import { compose } from 'recompose';
import Web from './screens/Web';
import TitleLogo from './components/TitleLogo';
import TitleButton from './components/TitleButton';
import withApollo from './services/apollo';
import codePush from './services/codePush';
import deepLinking from './services/deepLinking';
import pushNotifications from './services/pushNotifications';
import { FRONTEND_URL } from './constants';

const Router = createStackNavigator({
  Web: { screen: Web }
},{
  initialRouteName: 'Web',
  navigationOptions: {
    headerTitle: <TitleLogo />,
    headerLeft: <TitleButton side="left" type="profile" />,
    headerRight: <TitleButton side="right" type="hamburger" />,
    headerStyle: {
      backgroundColor: '#FFFFFF',
    }
  },
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
