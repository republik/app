import React from 'react'
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native'

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

const TitleLogo = () => (
  <View style={styles.container}>
    <TouchableOpacity>
      <Image
        source={require('../assets/images/logo-title.png')}
        style={styles.logo}
      />
    </TouchableOpacity>
  </View>
)

export default TitleLogo
