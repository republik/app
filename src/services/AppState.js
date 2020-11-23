import React, { useEffect, useState } from 'react'
import { AppState } from 'react-native'

import { useGlobalState } from '../GlobalState'

const AppStateService = () => {
  const {
    dispatch
  } = useGlobalState()

  const [appState, setAppState] = useState(AppState.currentState)

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      setAppState(nextAppState)
    }

    AppState.addEventListener('change', handleAppStateChange)
    return () => {
      AppState.removeEventListener('change', handleAppStateChange)
    }
  }, [])
  useEffect(() => {
    dispatch({
      type: 'postMessage',
      content: {
        type: 'appState',
        current: appState
      }
    })
  }, [ appState ])

  return null
}

export default AppStateService

