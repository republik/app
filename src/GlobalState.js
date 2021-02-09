import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useReducer,
} from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

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
    console.error('readStore', e)
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

const messageReducer = (state, action) => {
  switch (action.type) {
    case 'postMessage':
      return state.concat({
        id: uuidv4(),
        content: action.content,
      })
    case 'clearMessage':
      return state.filter((msg) => msg.id !== action.id)
    case 'markMessage':
      const message = state.find((msg) => msg.id === action.id)
      if (!message) {
        if (action.mark) {
          console.warn('message to mark not found')
        }
        return state
      }
      return state.map((msg) =>
        msg.id === message.id
          ? {
              ...message,
              mark: action.mark,
            }
          : msg,
      )
    default:
      throw new Error()
  }
}

export const GlobalStateProvider = ({ children }) => {
  const [error, setError] = useState()

  const [persistedState, setPersistedStateRaw] = useState({})
  const setPersistedState = useCallback(
    (newState) => setPersistedStateRaw((state) => ({ ...state, ...newState })),
    [],
  )

  const [globalState, setGlobalStateRaw] = useState({})
  const setGlobalState = useCallback(
    (newState) => setGlobalStateRaw((state) => ({ ...state, ...newState })),
    [],
  )

  const [pendingMessages, dispatch] = useReducer(messageReducer, [])

  useEffect(() => {
    readStore({
      setPersistedState,
      setGlobalState,
      setError,
    })
  }, [setGlobalState, setPersistedState])

  useEffect(() => {
    writeStore({
      persistedState,
      setError,
    })
  }, [persistedState])

  const context = {
    error,
    persistedState,
    setPersistedState,
    globalState,
    setGlobalState,
    pendingMessages,
    dispatch,
  }

  return <GlobalState.Provider value={context}>{children}</GlobalState.Provider>
}
