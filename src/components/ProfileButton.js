import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import ProfileIcon from '../assets/images/profile-icon.png'
import ProfilePlaceholder from '../assets/images/profile-placeholder.png'
import { me } from '../apollo'

const ProfileButton = ({ onPress, style, me }) => {
  let image
  let imageSize

  if (!me) {
    imageSize = 25
    image = ProfileIcon
  } else {
    imageSize = 30
    image = me.portrait ? { uri: me.portrait } : ProfilePlaceholder
  }

  return (
    <TouchableOpacity style={style} onPress={() => onPress()}>
      <Image
        source={image}
        style={{ width: imageSize, height: imageSize }}
      />
    </TouchableOpacity>
  )
}

export default me(ProfileButton)
