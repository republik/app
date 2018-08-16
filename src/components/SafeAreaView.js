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
      }} forceInset={{ bottom: 'never' }}>
        <View style={{flex: 1}} onLayout={this.onLayout}>
          <StatusBar hidden={landscape || fullscreen}  />
          {children}
        </View>
      </RawSafeAreaView>
    )
  }
}

export default SafeAreaView
