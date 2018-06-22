import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import ProfileButton from './ProfileButton'
import HamburgerButton from './HamburgerButton'
import { withMenuState } from '../apollo'
import PDF from '../assets/images/pdf.png'
import Share from '../assets/images/share.png'
import Audio from '../assets/images/audio.png'
import Discussion from '../assets/images/discussion.png'
import ChevronUp from '../assets/images/chevron-up.png'
import ChevronDown from '../assets/images/chevron-down.png'

const buttons = {
  pdf: PDF,
  audio: Audio,
  share: Share,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  profile: ProfileButton,
  discussion: Discussion,
  hamburger: HamburgerButton
}

const TitleButton = ({ type, side, size, menuActive, onPress, style }) => {
  const margins = side === 'left'
    ? { marginLeft: 15 }
    : { marginRight: 15 }

  if (typeof buttons[type] === 'number') {
    const Wrapper = onPress ? TouchableOpacity : ({ children }) => children

    return (
      <Wrapper onPress={onPress}>
        <Image
          source={buttons[type]}
          style={{ ...margins, ...style, width: size, height: size }}
        />
      </Wrapper>
    )
  }

  const Button = buttons[type]

  return (
    <Button
      style={[margins, style]}
      active={menuActive}
      onPress={onPress}
    />
  )
}

TitleButton.defaultProps = {
  size: 25
}

export default withMenuState(TitleButton)
