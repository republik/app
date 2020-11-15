import React, { useRef } from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView, Share, Platform } from 'react-native'
import { APP_VERSION } from '../constants'

const Web = ({ webUrl, onNavigationStateChange, onSignedIn, onReady }) => {
  const webviewRef = useRef()

  const postMessage = (message) => {
    webviewRef.current.postMessage(JSON.stringify(message))
  }

  const onMessage = (e) => {
    const message = JSON.parse(e.nativeEvent.data) || {}
    if (message.type === 'share') {
      share(message.payload)
    } else if (message.type === 'isSignedIn') {
      if (message.payload && onSignedIn) {
        onSignedIn(postMessage)
      }
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
        ref={webviewRef}
        source={{ uri: webUrl }}
        applicationNameForUserAgent={`RepublikApp/${APP_VERSION}`}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={(e) => onMessage(e)}
        onLoadEnd={() => {
          // ready to receive postMessage
        }}
      />
    </>
  )
}

export default Web
