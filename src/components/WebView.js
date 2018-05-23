import React, { Fragment } from 'React';
import { View, Image, StyleSheet } from 'react-native';
import WebView from 'react-native-wkwebview-reborn';
import { listenHistory } from '../utils/webHistory';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 0,
    left: 0,
    zIndex: 100,
    width: '100%',
    height: '100%',
    position: 'absolute',
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
      this.setState({ source: url }, () => {
        this.props.onNavigationStateChange({ url });
      });
    }
  }

  render() {
    const { loading, onNavigationStateChange, ...props } = this.props;

    return (
      <Fragment>
        { loading && <LoadingState /> }
        <WebView
          {...this.props}
          onNavigationStateChange={this.onNavigationStateChange}
          onMessage={e => this.onNavigationStateChange({ url: e.nativeEvent.data.url })}
          injectedJavaScript={listenHistory}
          allowsBackForwardNavigationGestures
          startInLoadingState
        />
      </Fragment>
    )
  }
};

export default CustomWebView;
