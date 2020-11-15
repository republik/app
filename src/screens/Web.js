import React from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView, Share, Platform } from 'react-native'
import { APP_VERSION } from '../constants'

const Web = ({ webUrl, onNavigationStateChange }) => {
  const injectedJS = `
  window.addEventListener('message', (event) => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ data: event.data})
    );
  });
  true; // note: this is required, or you'll sometimes get silent failures
  `
  const onMessage = (e) => {
    const message = JSON.parse(e.nativeEvent.data) || {}
    if (message.type === 'share') {
      share(message.payload)
    }
  }

  const share = async ({ url, title, message, subject, dialogTitle }) => {
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? {
              url,
              title,
              subject,
              message,
            }
          : {
              dialogTitle,
              title,
              message: [message, url].filter(Boolean).join('\n'),
            },
      )
    } catch (error) {
      console.warn(error.message)
    }
  }

  return (
    <>
      <SafeAreaView />
      <WebView
        source={{ uri: webUrl }}
        applicationNameForUserAgent={`RepublikApp/${APP_VERSION}`}
        injectedJavaScript={injectedJS}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={(e) => onMessage(e)}
      />
    </>
  )
}

export default Web
