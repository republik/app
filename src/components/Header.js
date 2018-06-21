import React, { Fragment } from 'react'
import { compose } from 'react-apollo'
import { View, Text, Image, TouchableOpacity, Linking, Share, StyleSheet } from 'react-native'
import Popover from './Popover'
import TitleButton from './TitleButton'
import { parseURL } from '../utils/url'
import { getPdfUrl } from '../utils/pdf'
import { FRONTEND_BASE_URL, HOME_URL, FEED_URL } from '../constants'
import {
  setUrl,
  toggleMenu,
  withMenuState,
  withCurrentUrl,
  withCurrentArticle,
  toggleSecondaryMenu
} from '../apollo'

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

const MainHeader = ({ toggleMenu, setUrl, currentUrl }) => {
  const currentPath = parseURL(currentUrl).path
  const onLogoClick = () => setUrl({ variables: {
    url: currentPath === '/' ? FEED_URL : HOME_URL }
  })

  return (
    <View style={styles.container}>
      <TitleButton
        side="left"
        type="profile"
        onPress={toggleMenu}
      />
      <TouchableOpacity onPress={onLogoClick}>
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
  currentUrl,
  toggleMenu,
  menuActive,
  secondaryMenuActive,
  secondaryMenuVisible,
  toggleSecondaryMenu
}) => (
  <Fragment>
    <MainHeader
      setUrl={setUrl}
      currentUrl={currentUrl}
      toggleMenu={toggleMenu}
    />
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
  toggleMenu,
  withMenuState,
  withCurrentUrl,
  withCurrentArticle,
  toggleSecondaryMenu
)(Header)
