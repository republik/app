import React from 'react'
import { compose } from 'react-apollo'
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native'
import TitleButton from './TitleButton'
import { setUrl, withCurrentArticle } from '../apollo'
import { HOME_URL } from '../constants'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    justifyContent: 'space-between',
    borderBottomColor: 'transparent'
  },
  logo: {
    width: 150,
    height: 25

  }
})

const Header = ({ article, setUrl, toggleMenu }) => {
  const borderBottomColor = (article && article.color) || 'transparent'

  return (
    <View style={[styles.container, { borderBottomColor }]}>
      <TitleButton
        side="left"
        type="profile"
        onPress={toggleMenu}
      />
      <TouchableOpacity onPress={() => setUrl({ variables: { url: HOME_URL } })}>
        <Image
          source={require('../assets/images/logo-title.png')}
          style={styles.logo}
        />
      </TouchableOpacity>
      <TitleButton
        side="right"
        type="hamburger"
        onPress={toggleMenu}
      />
    </View>
  )
}

export default compose(setUrl, withCurrentArticle)(Header)
