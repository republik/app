import React, { Component } from 'react'
import { Animated, TouchableWithoutFeedback } from 'react-native'

class Hamburger extends Component {
  constructor (props) {
    super(props)

    this.state = { active: false }

    const { active } = props

    this.width = new Animated.Value(active ? 12 : 22)
    this.topBar = new Animated.Value(active ? 1 : 0)
    this.bottomBar = new Animated.Value(active ? 1 : 0)
    this.marginLeft = new Animated.Value(active ? -13 : 0)
    this.topBarMargin = new Animated.Value(active ? -2 : 0)
    this.bottomBarMargin = new Animated.Value(active ? 2 : 4)
    this.middleBarOpacity = new Animated.Value(active ? 0 : 1)
  }

  animate () {
    if (this.state.active) {
      Animated.spring(this.topBar, { toValue: 0 }).start()
      Animated.spring(this.bottomBar, { toValue: 0 }).start()
      Animated.spring(this.bottomBarMargin, { toValue: 4 }).start()
      Animated.spring(this.middleBarOpacity, {
        toValue: 1,
        duration: 1200
      }).start()
    } else {
      Animated.spring(this.topBar, { toValue: 0.9 }).start()
      Animated.spring(this.bottomBar, { toValue: 0.9 }).start()
      Animated.spring(this.bottomBarMargin, { toValue: -8 }).start()
      Animated.timing(this.middleBarOpacity, {
        toValue: 0,
        duration: 30
      }).start()
    }
  }

  onPress = () => {
    this.setState(state => ({
      active: !state.active
    }), this.animate)
  }

  render () {
    const { color, style } = this.props

    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <Animated.View style={style}>
          <Animated.View style={{
            height: 2,
            width: this.width,
            backgroundColor: color,
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
            backgroundColor: color,
            opacity: this.middleBarOpacity
          }} />
          <Animated.View style={{
            height: 2,
            width: this.width,
            backgroundColor: color,
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

export default Hamburger
