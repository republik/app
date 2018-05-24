import React, { Fragment } from 'React';
import { View, Image, StyleSheet } from 'react-native';
import WebView from 'react-native-wkwebview-reborn';
import Spinner from 'react-native-spinkit';
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
  spinnerContainer: {
    position: 'relative',
  },
  loadingLogo: {
    width: 90,
    height: 90,
    top: 20,
    left: 20,
    position: 'absolute'
  }
});

const LoadingState = () => (
  <View style={styles.container}>
    <View styles={styles.spinnerContainer}>
      <Spinner isVisible size={130} type="Arc" color="#DDDDDD" />
      <Image
        style={styles.loadingLogo}
        source={require('../assets/images/icon.png')}
      />
    </View>
  </View>
);

class CustomWebView extends React.Component {
  // Native onNavigationStateChange method shim.
  // We call onNavigationStateChange either when the native calls, or onMessage
  onNavigationStateChange = ({ url }) => {
    if (this.props.source !== url) {
      this.props.onNavigationStateChange({ url });
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
