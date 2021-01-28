import React, { useEffect, useState } from 'react'
import { AppState } from 'react-native'

import { useGlobalState } from '../GlobalState'

const AppStateService = () => {
  const { 
    globalState: { appState },
    setGlobalState,
    dispatch
  } = useGlobalState()

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      setGlobalState({ appState: nextAppState })
    }
    handleAppStateChange(AppState.currentState)
    AppState.addEventListener('change', handleAppStateChange)
    return () => {
      AppState.removeEventListener('change', handleAppStateChange)
    }
  }, [])
  useEffect(() => {
    if (!appState) {
      return
    }
    dispatch({
      type: 'postMessage',
      content: {
        type: 'appState',
        current: appState,
      },
    })
  }, [appState, dispatch])

  return null
}

export default AppStateService
