import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import ProfileButton from './ProfileButton'
import HamburgerButton from './HamburgerButton'
import { withMenuState } from '../apollo'
import ChevronUp from '../assets/images/chevron-up.png'
import ChevronDown from '../assets/images/chevron-down.png'

const buttons = {
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  profile: ProfileButton,
  hamburger: HamburgerButton
}

const TitleButton = ({ type, side, size, menuActive, onPress }) => {
  const style = side === 'left'
    ? { marginLeft: 15 }
    : { marginRight: 15 }

  if (typeof buttons[type] === 'number') {
    const Wrapper = onPress ? TouchableOpacity : ({ children }) => children

    return (
      <Wrapper onPress={onPress}>
        <Image
          source={buttons[type]}
          style={{ width: size, height: size }}
        />
      </Wrapper>
    )
  }

  const Button = buttons[type]

  return (
    <Button
      style={style}
      active={menuActive}
      onPress={onPress}
    />
  )
}

TitleButton.defaultProps = {
  size: 25
}

export default withMenuState(TitleButton)
