import React, { Component } from 'react'
import {
  Dimensions, StatusBar, View// , SafeAreaView as RawSafeAreaView
} from 'react-native'
import { SafeAreaView as RawSafeAreaView } from 'react-navigation'

const getHiddenStatusBar = () => {
  const { width, height } = Dimensions.get('window')

  return (
    width > height && // landscape
    height < 600 // not big enough tablet
  )
}

class SafeAreaView extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hiddenStatusBar: getHiddenStatusBar()
    }
  }
  onLayout = () => {
    const hiddenStatusBar = getHiddenStatusBar()
    if (hiddenStatusBar !== this.state.hiddenStatusBar) {
      this.setState({
        hiddenStatusBar
      })
    }
  }
  render () {
    const { children, fullscreen } = this.props
    const { hiddenStatusBar } = this.state
    return (
      <RawSafeAreaView style={{
        flex: 1,
        backgroundColor: fullscreen ? '#000' : '#fff'
      }} forceInset={{
        bottom: 'never',
        top: fullscreen ? 'never' : 'always'
      }}>
        <StatusBar hidden={hiddenStatusBar || fullscreen} />
        <View style={{ flex: 1 }} onLayout={this.onLayout}>
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
