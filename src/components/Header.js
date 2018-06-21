import React, { Fragment } from 'react'
import { compose } from 'react-apollo'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import Popover from './Popover'
import TitleButton from './TitleButton'
import { toggleMenu, setUrl, withCurrentArticle, withMenuState, toggleSecondaryMenu } from '../apollo'
import { HOME_URL } from '../constants'

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    backgroundColor: '#FFF',
    justifyContent: 'space-between'
  },
  logo: {
    width: 150,
    height: 25
  },
  series: {
    flex: 1,
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  seriesName: {
    fontSize: 15,
    marginRight: 5
  }
})

const MainHeader = ({ toggleMenu, setUrl }) => (
  <View style={styles.container}>
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

const SeriesHeader = ({
  name,
  active,
  menuOpened,
  toggleMenu,
  toggleSecondaryMenu
}) => {
  const icon = menuOpened ? 'chevronUp' : 'chevronDown'

  return (
    <Popover active={active} style={styles.container}>
      <TouchableOpacity style={styles.series} onPress={() => toggleSecondaryMenu()}>
        <Text style={styles.seriesName}>{name}</Text>
        <TitleButton type={icon} />
      </TouchableOpacity>
      <TitleButton
        side="right"
        type="hamburger"
        onPress={toggleMenu}
      />
    </Popover>
  )
}

const Header = ({
  article,
  setUrl,
  toggleMenu,
  menuActive,
  secondaryMenuActive,
  secondaryMenuVisible,
  toggleSecondaryMenu
}) => {
  const series = article && article.series

  return (
    <Fragment>
      <MainHeader toggleMenu={toggleMenu} setUrl={setUrl} />
      <SeriesHeader
        name={series}
        toggleMenu={toggleMenu}
        menuOpened={secondaryMenuActive}
        toggleSecondaryMenu={toggleSecondaryMenu}
        active={series && !menuActive && secondaryMenuVisible}
      />
    </Fragment>
  )
}

export default compose(
  setUrl,
  withCurrentArticle,
  withMenuState,
  toggleMenu,
  toggleSecondaryMenu
)(Header)
