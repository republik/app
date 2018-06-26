import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'

const styles = StyleSheet.create({
  bar: {
    left: '-10%',
    top: '-3.9%',
    width: '20%',
    height: '7.8%',
    borderRadius: 5,
    position: 'absolute',
    backgroundColor: '#999'
  }
})

class Spinner extends React.Component {
  timers = []
  state = {
    bars: [
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1)
    ]
  }

  componentDidMount () {
    this.state.bars.forEach((val, index) => {
      const timer = setTimeout(() => this.animate(index), (12 - index) * 100)
      this.timers.push(timer)
    })
  }

  componentWillUnmount () {
    this.timers.forEach(timer => clearTimeout(timer))
    this.unmounted = true
  }

  animate (index) {
    Animated.sequence([
      Animated.timing(this.state.bars[index], { toValue: 0.15, duration: 600 }),
      Animated.timing(this.state.bars[index], { toValue: 1, duration: 600 })
    ]).start(() => {
      if (!this.unmounted) {
        this.animate(index)
      }
    })
  }

  renderBar (i) {
    const { size } = this.props

    return <Animated.View
      key={i}
      style={[styles.bar, { opacity: this.state.bars[i] }, { transform: [
        { translateX: size / 2 },
        { translateY: size / 2 },
        { rotate: `${(i * 30)}deg` },
        { translateX: size / 2 }
      ] }]}
    />
  }

  render () {
    let bars = []
    const { size } = this.props

    for (let i = 0; i < 12; i++) {
      bars.push(this.renderBar(i))
    }

    return (
      <View style={{ width: size, height: size }}>
        {bars}
      </View>
    )
  }
}

export default Spinner
