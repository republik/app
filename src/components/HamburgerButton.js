import React, { Component } from 'react'
import { StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native'

const styles = StyleSheet.create({
  container: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

class HamburgerButton extends Component {
  constructor (props) {
    super(props)

    this.topBar = new Animated.Value(0)
    this.bottomBar = new Animated.Value(0)
    this.marginLeft = new Animated.Value(0)
    this.topBarMargin = new Animated.Value(0)
    this.bottomBarMargin = new Animated.Value(4)
    this.middleBarOpacity = new Animated.Value(1)
  }

  componentWillReceiveProps(newProps) {
    if (newProps.active) {
      Animated.parallel([
        Animated.spring(this.topBar, { toValue: 0.9 }),
        Animated.spring(this.bottomBar, { toValue: 0.9 }),
        Animated.spring(this.bottomBarMargin, { toValue: -8 }),
        Animated.timing(this.middleBarOpacity, { toValue: 0, duration: 30 })
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(this.topBar, { toValue: 0 }),
        Animated.spring(this.bottomBar, { toValue: 0 }),
        Animated.spring(this.bottomBarMargin, { toValue: 4 }),
        Animated.spring(this.middleBarOpacity, { toValue: 1, duration: 1200 })
      ]).start()
    }
  }

  render() {
    const { style } = this.props

    return (
      <TouchableWithoutFeedback onPress={() => this.props.onPress()}>
        <Animated.View style={[style, styles.container]}>
          <Animated.View style={{
            height: 2,
            width: 22,
            backgroundColor: '#000',
            marginLeft: this.marginLeft,
            marginBottom: this.topBarMargin,
            transform: [
              {
                rotate: this.topBar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-50deg']
                })
              }
            ]
          }} />
          <Animated.View style={{
            height: 2,
            width: 22,
            marginTop: 4,
            backgroundColor: '#000',
            opacity: this.middleBarOpacity
          }} />
          <Animated.View style={{
            height: 2,
            width: 22,
            backgroundColor: '#000',
            marginLeft: this.marginLeft,
            marginTop: this.bottomBarMargin,
            transform: [
              {
                rotate: this.bottomBar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '50deg']
                })
              }
            ]
          }} />
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }
}

export default HamburgerButton
