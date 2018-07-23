import React from 'react'
import { TouchableOpacity, StyleSheet, Text } from 'react-native'
import Popover from './Popover'
import { parseURL } from '../utils/url'
import { HOME_URL, HOME_PATH, FEED_URL, FEED_PATH, FORMATS_URL, FORMATS_PATH } from '../constants'

const styles = StyleSheet.create({
  container: {
    height: 45,
    zIndex: 300,
    width: '100%',
    borderBottomWidth: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomColor: 'rgb(218, 221, 220)'
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 16,
    color: '#B7C1BD'
  },
  active: {
    color: '#000'
  }
})

const Subheader = ({ visible, setUrl, currentUrl }) => {
  const url = parseURL(currentUrl)

  return (
    <Popover style={styles.container} active={visible}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => setUrl({ variables: { url: HOME_URL } })}
      >
        <Text style={[styles.text, url.path === HOME_PATH && styles.active]}>Front</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => setUrl({ variables: { url: FEED_URL } })}
      >
        <Text style={[styles.text, url.path === FEED_PATH && styles.active]}>Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => setUrl({ variables: { url: FORMATS_URL } })}
      >
        <Text style={[styles.text, url.path === FORMATS_PATH && styles.active]}>Rubriken</Text>
      </TouchableOpacity>
    </Popover>
  )
}

export default Subheader
