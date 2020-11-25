import React from 'react'
import { StatusBar, Appearance } from 'react-native'

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
      <StatusBar barStyle={isDark ? 'dark-content' : 'light-content'} />
      <Web />
      <PushService />
      <DeepLinkingService />
      <AppStateService />
      <AudioPlayer isDark={isDark} />
    </GlobalStateProvider>
  )
}

export default App
