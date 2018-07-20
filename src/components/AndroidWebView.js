import React from 'react'
import { WebView, requireNativeComponent, DeviceEventEmitter } from 'react-native'

export default class CustomWebView extends React.Component {
  componentDidMount () {
    // Listen for event triggered from native code when file chooser is opened
    DeviceEventEmitter.addListener('onFileChooserOpen', () => {
      this.props.onFileChooserOpen()
    })
  }

  postMessage = string => {
    this.ref.postMessage(string)
  }

  reload = () => {
    this.ref.reload()
  }

  stopLoading = () => {
    this.ref.stopLoading()
  }

  goBack = () => {
    this.ref.goBack()
  }

  render () {
    const { onFilePickerOpened, innerRef, ...props } = this.props

    return (
      <WebView
        {...props}
        ref={node => { this.ref = node }}
        nativeConfig={{
          component: RCTCustomWebView,
          props: {
            uploadEnabled: true,
            downloadEnabled: true
          }
        }}
      />
    )
  }
}

const RCTCustomWebView = requireNativeComponent(
  'CustomWebView',
  CustomWebView,
  WebView.extraNativeComponentConfig
)
