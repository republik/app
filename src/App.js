import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import PushService from './services/Push'
import DeepLinkingService from './services/DeepLinking'
import AppStateService from './services/AppState'
import CookieService from './services/Cookies'
import { ColorContextProvider } from './utils/colors'
import Web from './screens/Web'
import StatusBar from './components/StatusBar'
import { GlobalStateProvider } from './GlobalState'
import SetupAudioPlayerSerivce from './components/AudioPlayer/SetupAudioPlayerService'
import PrimitiveAudioPlayer from './components/AudioPlayer/PirmitiveAudioPlayer'

const App = () => {
  const [isAudioPlayerReady, setIsAudioPlayerReady] = useState(false)

  // Initialize the AudioPlayer
  useEffect(() => {
    const run = async () => {
      const nextReadyState = await SetupAudioPlayerSerivce()
      setIsAudioPlayerReady(nextReadyState)
    }
    if (!isAudioPlayerReady) {
      run()
    }
  }, [isAudioPlayerReady, setIsAudioPlayerReady])

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
          {isAudioPlayerReady && <PrimitiveAudioPlayer />}
        </ColorContextProvider>
      </SafeAreaProvider>
    </GlobalStateProvider>
  )
}

export default App
