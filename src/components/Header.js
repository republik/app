import React, { Fragment } from 'react'
import { compose } from 'react-apollo'
import { View, Text, Image, TouchableOpacity, Linking, Share, StyleSheet } from 'react-native'
import Popover from './Popover'
import TitleButton from './TitleButton'
import { toggleMenu, setUrl, withCurrentArticle, withMenuState, toggleSecondaryMenu } from '../apollo'
import { FRONTEND_BASE_URL, HOME_URL } from '../constants'
import { getPdfUrl } from '../utils/pdf'

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
  icons: {
    flex: 1,
    marginLeft: 15,
    flexDirection: 'row'
  },
  series: {
    flex: 1,
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

const onPDFClick = (article) => {
  Linking.openURL(getPdfUrl(article))
}

const onShareClick = (article) => {
  Share.share({
    title: article.title,
    message: `${FRONTEND_BASE_URL}${article.path}`
  })
}

const SeriesHeader = ({
  article,
  active,
  menuOpened,
  toggleMenu,
  toggleSecondaryMenu
}) => {
  const icon = menuOpened ? 'chevronUp' : 'chevronDown'
  const name = article && article.series
  const audio = article && article.audioSource
  const hasPdf = article && article.template === 'article'

  return (
    <Popover active={active} style={styles.container}>
      <View style={styles.icons}>
        {name && (
          <TouchableOpacity style={styles.series} onPress={() => toggleSecondaryMenu()}>
            <Fragment>
              <Text style={styles.seriesName}>{name}</Text>
              <TitleButton type={icon} />
            </Fragment>
          </TouchableOpacity>
        )}
        <TitleButton
          size={30}
          side="right"
          type="share"
          onPress={() => onShareClick(article)}
          style={{ marginRight: 5 }}
        />
        { hasPdf && (
          <TitleButton
            size={30}
            side="right"
            type="pdf"
            onPress={() => onPDFClick(article)}
            style={{ marginRight: 5 }}
          />
        )}
        { audio && (
          <TitleButton
            size={30}
            side="right"
            type="audio"
            style={{ marginRight: 5 }}
          />
        )}
      </View>
      <TitleButton
        side="right"
        type="hamburger"
        onPress={toggleMenu}
        style={{ marginLeft: 5 }}
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
}) => (
  <Fragment>
    <MainHeader toggleMenu={toggleMenu} setUrl={setUrl} />
    <SeriesHeader
      article={article}
      toggleMenu={toggleMenu}
      menuOpened={secondaryMenuActive}
      toggleSecondaryMenu={toggleSecondaryMenu}
      active={!menuActive && secondaryMenuVisible}
    />
  </Fragment>
)

export default compose(
  setUrl,
  withCurrentArticle,
  withMenuState,
  toggleMenu,
  toggleSecondaryMenu
)(Header)
