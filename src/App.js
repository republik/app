import React, { useEffect, useState } from 'react'
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
import SetupAudioPlayerSerivce from './components/AudioPlayer/SetupAudioPlayerService'

const App = () => {
  const [isAudioPlayerReady, setIsAudioPlayerReady] = useState(false)

  // Initializes the player
  useEffect(() => {
    const run = async () => {
      const nextReadyState = await SetupAudioPlayerSerivce()
      console.log('nextReadyState', nextReadyState)
      setIsAudioPlayerReady(nextReadyState)
    }
    if (!isAudioPlayerReady) {
      console.log('Running setup')
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
          {isAudioPlayerReady && <AudioPlayer />}
        </ColorContextProvider>
      </SafeAreaProvider>
    </GlobalStateProvider>
  )
}

export default App
