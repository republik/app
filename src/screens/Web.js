import React from 'react'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, SafeAreaView, View, StyleSheet } from 'react-native'
import { SIGN_IN_URL } from '../constants'

const LoadingState = () => (
  <View style={styles.container}>
    <ActivityIndicator color="#999" size="large" />
  </View>
)

const Web = () => {
  return (
    <>
      <SafeAreaView />
      <WebView source={{ uri: SIGN_IN_URL }} />
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
