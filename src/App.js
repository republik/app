import React from 'react'
import { View, StatusBar, Appearance } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import PushService from './services/Push'
import DeepLinkingService from './services/DeepLinking'
import AppStateService from './services/AppState'
import { ColorContextProvider } from './utils/colors'
import Web from './screens/Web'
import AudioPlayer from './components/AudioPlayer'
import { GlobalStateProvider } from './GlobalState'

const colorScheme = Appearance.getColorScheme()

const App = () => {
  return (
    <GlobalStateProvider>
      <PushService />
      <DeepLinkingService />
      <AppStateService />
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
        hidden={false} // TODO Gallery expanded
      />
      <SafeAreaProvider>
        <ColorContextProvider>
          <Web />
          <AudioPlayer />
        </ColorContextProvider>
      </SafeAreaProvider>
    </GlobalStateProvider>
  )
}

export default App
