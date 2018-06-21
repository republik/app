import React, { Component } from 'react'
import { Animated, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'absolute'
  }
})

class Popover extends Component {
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

  render () {
    const { style, children } = this.props

    return (
      <Animated.View style={[
        style,
        styles.container,
        { opacity: this.opacity, zIndex: this.zIndex }
      ]}>
        {children}
      </Animated.View>
    )
  }
}

Popover.defaultProps = {
  style: {}
}

export default Popover
