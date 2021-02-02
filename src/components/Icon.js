import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import PDF from '../assets/images/pdf.png'
import Share from '../assets/images/share.png'
import Play from '../assets/images/play.png'
import Lock from '../assets/images/lock.png'
import Pause from '../assets/images/pause.png'
import Rewind from '../assets/images/rewind.png'
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
  rewind: Rewind,
  lock: Lock,
  pause: Pause,
  audio: Audio,
  share: Share,
  close: Close,
  search: Search,
  IOSBack: IOSBack,
  chevronUp: ChevronUp,
  discussion: Discussion,
  chevronDown: ChevronDown,
  searchActive: SearchActive,
}

const Icon = ({ type, size, onPress, style, disabled }) => {
  const Wrapper = onPress ? TouchableOpacity : ({ children }) => children
  const opacity = disabled ? 0.3 : 1
  return (
    <Wrapper onPress={disabled ? null : onPress}>
      <Image
        source={buttons[type]}
        style={{
          ...style,
          width: size,
          height: size,
          opacity,
        }}
      />
    </Wrapper>
  )
}

Icon.defaultProps = {
  size: 25,
  disabled: false,
}

export default Icon
