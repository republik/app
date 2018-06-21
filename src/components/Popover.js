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

const DURATION = 300

class Popover extends Component {
  opacity = new Animated.Value(0);

  componentWillReceiveProps (newProps) {
    if (newProps.active) {
      Animated.timing(this.opacity, { toValue: 1, duration: DURATION }).start()
    } else {
      Animated.timing(this.opacity, { toValue: 0, duration: DURATION }).start()
    }
  }

  render () {
    const { active, style, children } = this.props

    return (
      <Animated.View
        pointerEvents={active ? 'auto' : 'none'}
        style={[style, styles.container, { opacity: this.opacity }]}
      >
        {children}
      </Animated.View>
    )
  }
}

Popover.defaultProps = {
  style: {}
}

export default Popover
