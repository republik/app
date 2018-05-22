import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { compose } from 'recompose';
import WebView from './components/WebView';
import codePush from './services/codePush';
import deepLinking from './services/deepLinking';
import pushNotifications from './services/pushNotifications';

// TODO: Add this as an env variable
const LOGIN_URL = 'https://www.republik.ch/anmelden';

class App extends Component {
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
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
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
