import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import PushService from './services/Push'
import DeepLinkingService from './services/DeepLinking'
import AppStateService from './services/AppState'
import CookieService from './services/Cookies'
import { ColorContextProvider } from './utils/colors'
import Web from './screens/Web'
import AudioPlayer from './components/AudioPlayer'
import StatusBar from './components/StatusBar'
import { GlobalStateProvider } from './GlobalState'

const App = () => {
  return (
    <GlobalStateProvider>
      <PushService />
      <DeepLinkingService />
      <AppStateService />
      <CookieService />
      <SafeAreaProvider>
        <ColorContextProvider>
          <StatusBar />
          <Web />
          <AudioPlayer />
        </ColorContextProvider>
      </SafeAreaProvider>
    </GlobalStateProvider>
  )
}

export default App
