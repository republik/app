import React from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView } from 'react-native'

const Web = ({ webUrl, onNavigationStateChange }) => {
  const injectedJS = `
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
        source={{ uri: webUrl }}
        injectedJavaScript={injectedJS}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={(e) => {
          const data = JSON.parse(e.nativeEvent.data)
          console.log(data)
        }}
      />
    </>
  )
}

export default Web
