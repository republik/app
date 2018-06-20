import React from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { compose } from 'react-apollo'
import { me, setUrl, closeMenu, signOut } from '../apollo'
import { FRONTEND_BASE_URL, ACCOUNT_URL, FEED_URL, FORMATS_URL, EVENTS_URL, COMMUNITY_URL } from '../constants'

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFF'
  },
  separator: {
    height: 1,
    marginVertical: 20,
    backgroundColor: '#DADDDC'
  },
  itemContainer: {
    marginBottom: 10
  },
  itemText: {
    fontSize: 21
  }
})

const MenuItem = ({ onPress, children }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.itemContainer}
  >
    <Text style={styles.itemText}>{children}</Text>
  </TouchableOpacity>
)

const Separator = () => (
  <View style={styles.separator} />
)

class Menu extends React.Component {
  zIndex = new Animated.Value(0);
  opacity = new Animated.Value(0);

  componentWillReceiveProps (newProps) {
    if (newProps.active) {
      Animated.sequence([
        Animated.timing(this.zIndex, { toValue: 200, duration: 100 }),
        Animated.timing(this.opacity, { toValue: 1, duration: 250 })
      ]).start()
    } else {
      Animated.sequence([
        Animated.timing(this.opacity, { toValue: 0, duration: 250 }),
        Animated.timing(this.zIndex, { toValue: 0, duration: 100 })
      ]).start()
    }
  }

  onItemClick = url => {
    this.props.setUrl({ variables: { url } })
    this.props.closeMenu()
  }

  onLogoutClick = () => {
    this.props.signOut()
    this.props.onLogout()
    this.props.closeMenu()
  }

  render () {
    const id = this.props.me && this.props.me

    return (
      <Animated.View style={[
        styles.container,
        { opacity: this.opacity, zIndex: this.zIndex }
      ]}>
        <MenuItem onPress={() => this.onItemClick(ACCOUNT_URL)}>
          Konto
        </MenuItem>
        <MenuItem onPress={() => this.onItemClick(`${FRONTEND_BASE_URL}/~${id}`)}>
          Profil
        </MenuItem>
        <MenuItem onPress={this.onLogoutClick}>
          abmelden
        </MenuItem>
        <Separator />
        <MenuItem onPress={() => this.onItemClick(FEED_URL)}>
          Feed
        </MenuItem>
        <MenuItem onPress={() => this.onItemClick(FORMATS_URL)}>
          Rubriken
        </MenuItem>
        <MenuItem onPress={() => this.onItemClick(EVENTS_URL)}>
          Veranstaltungen
        </MenuItem>
        <MenuItem onPress={() => this.onItemClick(COMMUNITY_URL)}>
          Community
        </MenuItem>
      </Animated.View>
    )
  }
};

export default compose(
  me,
  setUrl,
  signOut,
  closeMenu
)(Menu)
