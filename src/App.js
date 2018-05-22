import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { compose } from 'recompose';
import WebView from './components/WebView';
import codePush from './services/codePush';
import deepLinking from './services/deepLinking';
import pushNotifications from './services/pushNotifications';

// TODO: Add this as an env variable
const LOGIN_URL = 'https://www.republik.ch/anmelden';

class App extends Component {
  componentDidMount() {
    SplashScreen.hide()
  }

  render() {
    return (
      <WebView
        automaticallyAdjustContentInsets={false}
        style={styles.webView}
        source={{uri: LOGIN_URL}}
        javaScriptEnabled
        startInLoadingState
        scalesPageToFit
      />
    );
  }
}

var styles = StyleSheet.create({
  webView: {
    flex: 1,
    marginTop: 20,
  }
});

export default compose(
  codePush,
  deepLinking,
  pushNotifications,
)(App);
