import React from 'React';
import { View, Image, StyleSheet } from 'react-native';
import WebView from 'react-native-wkwebview-reborn';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  loadingLogo: {
    width: 90,
    height: 90,
  }
});

const LoadingState = () => (
  <View style={styles.container}>
    <Image
      style={styles.loadingLogo}
      source={require('../assets/images/icon.png')}
    />
  </View>
);

const CustomWebView = props => (
  <WebView
    {...props}
    startInLoadingState
    renderLoading={LoadingState}
    allowsBackForwardNavigationGestures
  />
);

export default CustomWebView;
