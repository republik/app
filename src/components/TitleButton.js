import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import HamburgerButton from './HamburgerButton'
import { getMenuState } from '../apollo'

const icons = {
  profile: require('../assets/images/profile-icon.png'),
  hamburger: require('../assets/images/hamburger-icon.png')
}

const TitleButton = ({ type, side, menuActive, onPress }) => {
  const style = side === 'left'
    ? { marginLeft: 15 }
    : { marginRight: 15 }

  if (type === 'hamburger') {
    return (
      <HamburgerButton
        style={style}
        color="#000"
        active={menuActive}
        onPress={onPress}
      />
    )
  }

  return (
    <TouchableOpacity style={style} onPress={() => onPress() }>
      <Image
        source={icons[type]}
        style={{ width: 25, height: 25 }}
      />
    </TouchableOpacity>
  )
}

export default getMenuState(TitleButton)
