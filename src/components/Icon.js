import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import ProfileButton from './ProfileButton'
import HamburgerButton from './HamburgerButton'
import { withMenuState } from '../apollo'
import PDF from '../assets/images/pdf.png'
import Share from '../assets/images/share.png'
import Play from '../assets/images/play.png'
import Lock from '../assets/images/lock.png'
import Pause from '../assets/images/pause.png'
import Close from '../assets/images/close.png'
import Audio from '../assets/images/audio.png'
import Search from '../assets/images/search.png'
import IOSBack from '../assets/images/ios-back.png'
import Discussion from '../assets/images/discussion.png'
import ChevronUp from '../assets/images/chevron-up.png'
import ChevronDown from '../assets/images/chevron-down.png'
import SearchActive from '../assets/images/search-active.png'

const buttons = {
  pdf: PDF,
  play: Play,
  lock: Lock,
  pause: Pause,
  audio: Audio,
  share: Share,
  close: Close,
  search: Search,
  IOSBack: IOSBack,
  chevronUp: ChevronUp,
  profile: ProfileButton,
  discussion: Discussion,
  chevronDown: ChevronDown,
  hamburger: HamburgerButton,
  searchActive: SearchActive
}

const Icon = ({ type, side, size, menuActive, onPress, style }) => {
  if (typeof buttons[type] === 'number') {
    const Wrapper = onPress ? TouchableOpacity : ({ children }) => children

    return (
      <Wrapper onPress={onPress}>
        <Image
          source={buttons[type]}
          style={[style, { padding: 15, width: size, height: size }]}
        />
      </Wrapper>
    )
  }

  const Button = buttons[type]

  return (
    <Button
      style={[style, { padding: 15 }]}
      active={menuActive}
      onPress={onPress}
    />
  )
}

Icon.defaultProps = {
  size: 25
}

export default withMenuState(Icon)
