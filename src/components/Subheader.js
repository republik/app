import React from 'react'
import { TouchableOpacity, StyleSheet, Text, Animated } from 'react-native'
import { parseURL } from '../utils/url'
import { HOME_URL, HOME_PATH, FEED_URL, FEED_PATH, FORMATS_URL, FORMATS_PATH } from '../constants'

const styles = StyleSheet.create({
  container: {
    left: 0,
    zIndex: 300,
    width: '100%',
    position: 'absolute',
    borderBottomWidth: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF'
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

const DURATION = 300
const BORDER_HEIGHT = 3
const HEADER_HEIGHT = 45

class Subheader extends React.Component {
  constructor (props) {
    super(props)

    this.animating = false
    this.top = new Animated.Value(props.active ? 0 : -HEADER_HEIGHT)
  }

  componentWillReceiveProps (newProps) {
    if (!this.animating) {
      this.animating = true

      const animation = newProps.visible
        ? Animated.timing(this.top, { toValue: 0, duration: DURATION })
        : Animated.timing(this.top, { toValue: -HEADER_HEIGHT, duration: DURATION })

      animation.start(() => { this.animating = false })
    }
  }

  render () {
    const { visible, currentUrl, setUrl, borderColor } = this.props

    const url = parseURL(currentUrl)

    const pathActive = url.path === HOME_PATH
    const feedActive = url.path === FEED_PATH
    const formatsActive = url.path === FORMATS_PATH
    const noLinksActive = (!pathActive && !feedActive && !formatsActive)
    const height = borderColor ? HEADER_HEIGHT + BORDER_HEIGHT : HEADER_HEIGHT
    const borderBottomWidth = borderColor ? BORDER_HEIGHT : 1
    const borderBottomColor = borderColor || '#DADDDC'

    return (
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.container, { height, borderBottomColor, borderBottomWidth }, { top: this.top }]}
      >
        <TouchableOpacity
          style={styles.item}
          onPress={() => setUrl({ variables: { url: HOME_URL } })}
        >
          <Text style={[styles.text, (noLinksActive || pathActive) && styles.active]}>
            Front
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setUrl({ variables: { url: FEED_URL } })}
        >
          <Text style={[styles.text, (noLinksActive || feedActive) && styles.active]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setUrl({ variables: { url: FORMATS_URL } })}
        >
          <Text style={[styles.text, (noLinksActive || formatsActive) && styles.active]}>
            Rubriken
          </Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }
}

export default Subheader
