import React, { useEffect, useState } from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView, Linking } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'

import { SIGN_IN_URL } from '../constants'

const Web = () => {
  const [webURL, setWebURL] = useState(SIGN_IN_URL)

  const handleOpenURL = async (e) => {
    try {
      await AsyncStorage.setItem('currentUrl', e.url)
      setWebURL(e.url)
    } catch (e) {
      console.warn(e)
    }
  }

  const getWebViewURL = async () => {
    try {
      const value = await AsyncStorage.getItem('currentUrl')
      if (value !== null) {
        setWebURL(value)
      }
    } catch (e) {
      // error reading value
    }
  }

  const onNavigationStateChange = async ({ url }) => {
    try {
      await AsyncStorage.setItem('currentUrl', url)
    } catch (e) {
      console.warn(e)
    }
  }

  useEffect(() => {
    getWebViewURL()
    Linking.getInitialURL().then((url) => {
      if (url) handleOpenURL({ url })
    })
    Linking.addEventListener('url', handleOpenURL)
    return () => {
      Linking.removeEventListener('url', handleOpenURL)
    }
  }, [])

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
        source={{ uri: webURL }}
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
