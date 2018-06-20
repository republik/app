import React from 'react'
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { setUrl } from '../apollo'
import { HOME_URL } from '../constants'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 150,
    height: 25

  }
})

const TitleLogo = ({ setUrl }) => (
  <View style={styles.container}>
    <TouchableOpacity onPress={() => setUrl({ variables: { url: HOME_URL } })}>
      <Image
        source={require('../assets/images/logo-title.png')}
        style={styles.logo}
      />
    </TouchableOpacity>
  </View>
)

export default setUrl(TitleLogo)
