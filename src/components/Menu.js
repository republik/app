import React from 'react'
import { Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { compose } from 'react-apollo'
import { closeMenu, signOut } from '../apollo'

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
  }
})

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
        <TouchableOpacity onPress={this.onLogout}>
          <Text>abmelden</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }
};

export default compose(
  signOut,
  closeMenu
)(Menu)
