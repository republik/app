import React from 'react'
import { Dimensions } from 'react-native'

export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState('portrait')

  React.useEffect(() => {
    const checkIsLandscape = () => {
      const dim = Dimensions.get('screen')
      return dim.width >= dim.height
    }
    Dimensions.addEventListener('change', () => {
      setOrientation(checkIsLandscape() ? 'landscape' : 'portrait')
    })
    return () => {
      Dimensions.removeEventListener('change')
    }
  }, [])

  return orientation
}
