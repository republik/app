import React from 'react'
import { Image, TouchableOpacity, StyleSheet } from 'react-native'
import ProfileIcon from '../assets/images/profile-icon.png'
import ProfilePlaceholder from '../assets/images/profile-placeholder.png'
import { me } from '../apollo'

const styles = StyleSheet.create({
  container: {
    paddingRight: 5
  }
})

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
    <TouchableOpacity style={[style, styles.container]} onPress={() => onPress()}>
      <Image
        source={image}
        style={{ width: imageSize, height: imageSize }}
      />
    </TouchableOpacity>
  )
}

export default me(ProfileButton)
