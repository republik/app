import React from 'React';
import { View, Image, WebView , StyleSheet, Dimensions } from 'react-native';

const logoDimension = Dimensions.get("window").width * 0.2;

const styles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingLogo: {
    width: logoDimension,
    height: logoDimension,
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
