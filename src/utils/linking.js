import React, { useEffect } from 'react'
import { Linking } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'

const useDeepLinking = () => {
  const handleOpenURL = async (e) => {
    Linking.openURL(e.url)
    try {
      await AsyncStorage.setItem('currentUrl', e.url)
    } catch (e) {
      console.warn(e)
    }
  }
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleOpenURL({ url })
    })
    Linking.addEventListener('url', handleOpenURL)
    return () => {
      Linking.removeEventListener('url', handleOpenURL)
    }
  }, [])
}

export default useDeepLinking
