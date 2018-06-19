import React from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { compose } from 'react-apollo'
import { closeMenu, signOut } from '../apollo'

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

  onLogout = () => {
    this.props.signOut()
    this.props.onLogout()
    this.props.closeMenu()
  }

  render () {
    return (
      <Animated.View style={[
        styles.container,
        { opacity: this.opacity, zIndex: this.zIndex }
      ]}>
        <MenuItem>
          Konto
        </MenuItem>
        <MenuItem>
          Profil
        </MenuItem>
        <MenuItem onPress={this.onLogout}>
          abmelden
        </MenuItem>
        <Separator />
        <MenuItem>
          Feed
        </MenuItem>
        <MenuItem>
          Rubriken
        </MenuItem>
        <MenuItem>
          Veranstaltungen
        </MenuItem>
        <MenuItem>
          Community
        </MenuItem>
      </Animated.View>
    )
  }
};

export default compose(
  signOut,
  closeMenu
)(Menu)
