import React, { useContext } from 'react'
import { useColorScheme } from 'react-native'

//TODO get colors from styleguide
const colors = {
  light: {
    default: '#FFFFFF',
    logo: '#000000',
    overlay: '#FFFFFF',
    text: '#282828',
    textSoft: '#7D7D7D',
    primary: '#00AA00',
    progress: '#DADDDC',
    progressBuffer: '#7D7D7D',
    fullScreenStatusBar: '#000000',
  },
  dark: {
    default: '#191919',
    logo: '#FFFFFF',
    overlay: '#1F1F1F',
    text: '#F0F0F0',
    textSoft: '#A9A9A9',
    primary: '#00AA00',
    progress: '#292929',
    progressBuffer: '#4C4D4C',
    fullScreenStatusBar: '#000000',
  },
}

const ColorContext = React.createContext(colors.light)

export const ColorContextProvider = ({ children }) => {
  const colorScheme = useColorScheme()
  return (
    <ColorContext.Provider
      value={colorScheme === 'dark' ? colors.dark : colors.light}>
      {children}
    </ColorContext.Provider>
  )
}

export const useColorContext = () => {
  const colorContext = useContext(ColorContext)
  return colorContext
}
