import React, { Component } from 'react'
import {
  Dimensions, StatusBar, View// , SafeAreaView as RawSafeAreaView
} from 'react-native'
import { SafeAreaView as RawSafeAreaView } from 'react-navigation'

const isLandscape = () => {
  const { width, height } = Dimensions.get('window')
  return width > height
}

class SafeAreaView extends Component {
  constructor (props) {
    super(props)

    this.state = {
      landscape: isLandscape()
    }
  }
  onLayout = () => {
    const landscape = isLandscape()
    if (landscape !== this.state.landscape) {
      this.setState({
        landscape
      })
    }
  }
  render () {
    const { children, fullscreen } = this.props
    const { landscape } = this.state
    return (
      <RawSafeAreaView style={{
        flex: 1,
        backgroundColor: fullscreen ? '#000' : '#fff'
      }} forceInset={{
        bottom: 'never',
        top: fullscreen ? 'never' : 'always'
      }}>
        <StatusBar hidden={landscape || fullscreen}  />
        <View style={{flex: 1}} onLayout={this.onLayout}>
          {children}
        </View>
      </RawSafeAreaView>
    )
  }
}

SafeAreaView.defaultProps = {
  fullscreen: false
}

export default SafeAreaView
