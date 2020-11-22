import React, { useState, useEffect, useCallback, useContext } from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import { SIGN_IN_URL } from './constants'

const defaultPersistedState = {
  url: SIGN_IN_URL,
  isSignedIn: false
}

const GlobalState = React.createContext()

export const useGlobalState = () => {
  return useContext(GlobalState)
}

const KEY = 'globalState'

const readStore = async ({ setPersistedState, setGlobalState, setError }) => {
  try {
    const storedState = JSON.parse(await AsyncStorage.getItem(KEY))
    setPersistedState(storedState)
  } catch (e) {
    console.error(e)
    setError(e)
  }
  setGlobalState({ persistedStateReady: true })
}
const writeStore = async ({ persistedState, setError }) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(persistedState))
  } catch (e) {
    console.error(e)
    setError(e)
  }
}

export const GlobalStateProvider = ({ children }) => {
  const [error, setError] = useState()

  const [persistedState, setPersistedStateRaw] = useState(defaultPersistedState)
  const setPersistedState = useCallback(
    newState => setPersistedStateRaw(state => ({ ...state, ...newState })),
    []
  )

  const [globalState, setGlobalStateRaw] = useState({})
  const setGlobalState = useCallback(
    newState => setGlobalStateRaw(state => ({ ...state, ...newState })),
    []
  )

  useEffect(() => {
    readStore({
      setPersistedState,
      setGlobalState,
      setError
    })
  }, [])

  useEffect(() => {
    writeStore({
      persistedState,
      setError
    })
  }, [persistedState])

  const context = {
    error,
    persistedState,
    setPersistedState,
    globalState,
    setGlobalState
  }

  return <GlobalState.Provider value={context}>
    {children}
  </GlobalState.Provider>
}
