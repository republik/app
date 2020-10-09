import React, { useRef, useEffect } from 'react'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, SafeAreaView, View, StyleSheet } from 'react-native'
import { SIGN_IN_URL } from '../constants'

const LoadingState = () => (
  <View style={styles.container}>
    <ActivityIndicator color="#999" size="large" />
  </View>
)

const Web = () => {
  const runFirst = `
    window.addEventListener('message', (event) => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ data: event.data})
      );
    });
    true; // note: this is required, or you'll sometimes get silent failures
    `
  return (
    <>
      <SafeAreaView />
      <WebView
        source={{ uri: SIGN_IN_URL }}
        injectedJavaScript={runFirst}
        onMessage={(e) => {
          const data = JSON.parse(e.nativeEvent.data)
          console.log(data)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'blue',
    flex: 1,
    top: 0,
    left: 0,
    zIndex: 150,
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default Web
