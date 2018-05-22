import React from 'React';
import { View, Image, WebView , StyleSheet } from 'react-native';

const styles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingLogo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  }
}

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
  />
);

export default CustomWebView;
