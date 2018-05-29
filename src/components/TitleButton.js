import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import ProfileButton from './ProfileButton'
import HamburgerButton from './HamburgerButton'
import { getMenuState } from '../apollo'

const buttons = {
  profile: ProfileButton,
  hamburger: HamburgerButton
}

const TitleButton = ({ type, side, menuActive, onPress }) => {
  const style = side === 'left'
    ? { marginLeft: 15 }
    : { marginRight: 15 }

  const Button = buttons[type]

  return (
    <Button
      style={style}
      active={menuActive}
      onPress={onPress}
    />
  )
}

export default getMenuState(TitleButton)
