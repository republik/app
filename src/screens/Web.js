import React, { useEffect, useState } from 'react'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, SafeAreaView, View, StyleSheet } from 'react-native'
import { SIGN_IN_URL } from '../constants'
import AsyncStorage from '@react-native-community/async-storage'

const LoadingState = () => (
  <View style={styles.container}>
    <ActivityIndicator color="#999" size="large" />
  </View>
)

const Web = () => {
  const [startURL, setStartURL] = useState(SIGN_IN_URL)

  const getWebViewURL = async () => {
    try {
      const value = await AsyncStorage.getItem('currentUrl')
      if (value !== null) {
        setStartURL(value)
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
        source={{ uri: startURL }}
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
