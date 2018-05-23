import React from 'React';
import { View, Image, StyleSheet } from 'react-native';
import WebView from 'react-native-wkwebview-reborn';
import { listenHistory } from '../utils/webHistory';

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

class CustomWebView extends React.Component {
  state = { source: '' };

  // Native onNavigationStateChange method shim.
  // We call onNavigationStateChange either when the native calls, or onMessage
  onNavigationStateChange = ({ url }) => {
    if (this.state.source !== url) {
      this.props.onNavigationStateChange({ url });
      this.setState({ source: url });
    }
  }

  render() {
    const { onNavigationStateChange, ...props } = this.props;

    return (
      <WebView
        {...this.props}
        startInLoadingState
        renderLoading={LoadingState}
        injectedJavaScript={listenHistory}
        onNavigationStateChange={this.onNavigationStateChange}
        onMessage={e => this.onNavigationStateChange({ url: e.nativeEvent.data })}
        allowsBackForwardNavigationGestures
      />
    )
  }
};

export default CustomWebView;
