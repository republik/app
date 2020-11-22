import React from 'react'
import { StatusBar } from 'react-native'

import PushService from './services/Push'
import DeepLinkingService from './services/DeepLinking'

import Web from './screens/Web'

import { GlobalStateProvider } from './GlobalState'

const App = () => {
  return (
    <GlobalStateProvider>
      <StatusBar />
      <Web />
      <PushService />
      <DeepLinkingService />
    </GlobalStateProvider>
  )
}

export default App
