import React, { useRef, useState, useEffect } from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView, Share, Platform } from 'react-native'
import { APP_VERSION } from '../constants'
import { useGlobalState } from '../GlobalState'
import SplashScreen from 'react-native-splash-screen'

const Web = () => {
  const { globalState, setGlobalState, persistedState, setPersistedState } = useGlobalState()

  const webviewRef = useRef()
  const [ webUrl, setWebUrl ] = useState()

  useEffect(() => {
    // wait for all services
    if (!globalState.deepLinkingReady || !globalState.pushReady || !globalState.persistedStateReady) {
      return
    }

    if (globalState.pendingUrl) {
      // navigate to pendingUrl a service
      setWebUrl(globalState.pendingUrl)
      setGlobalState({ pendingUrl: null })
    } else if (!webUrl) {
      // if nothing is pending navigate to saved url
      // - which also has a default
      setWebUrl(persistedState.url)
    }

    if (!webUrl) {
      SplashScreen.hide()
    }
  }, [webUrl, globalState, persistedState])

  const postMessage = (message) => {
    webviewRef.current.postMessage(JSON.stringify(message))
  }

  const onMessage = (e) => {
    const message = JSON.parse(e.nativeEvent.data) || {}
    if (message.type === 'share') {
      share(message.payload)
    } else if (message.type === 'isSignedIn') {
      setPersistedState({ isSignedIn: message.payload })
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
      alert(error.message)
    }
  }

  return (
    <>
      <SafeAreaView />
      {webUrl && <WebView
        ref={webviewRef}
        source={{ uri: webUrl }}
        applicationNameForUserAgent={`RepublikApp/${APP_VERSION}`}
        onNavigationStateChange={({ url }) => {
          console.log('onNavigationStateChange', url)
          setPersistedState({ url })
        }}
        onMessage={(e) => onMessage(e)}
        onLoadEnd={() => {
          // ready to receive postMessage
        }}
      />}
    </>
  )
}

export default Web
