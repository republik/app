import React from 'react'
import { StatusBar, Appearance, SafeAreaView } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import PushService from './services/Push'
import DeepLinkingService from './services/DeepLinking'
import AppStateService from './services/AppState'

import Web from './screens/Web'
import AudioPlayer from './components/AudioPlayer'
import { GlobalStateProvider } from './GlobalState'

const colorScheme = Appearance.getColorScheme()
const isDark = colorScheme === 'dark'

const App = () => {
  return (
    <GlobalStateProvider>
      <PushService />
      <DeepLinkingService />
      <AppStateService />
      <StatusBar barStyle={isDark ? 'dark-content' : 'light-content'} />
      <SafeAreaProvider>
        <Web />
        <AudioPlayer />
      </SafeAreaProvider>
    </GlobalStateProvider>
  )
}

export default App
