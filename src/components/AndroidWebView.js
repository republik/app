import React from 'react'
import { WebView, requireNativeComponent } from 'react-native'

export default class CustomWebView extends React.Component {
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
    const { innerRef, ...props } = this.props

    return (
      <WebView
        {...props}
        ref={node => { this.ref = node }}
        nativeConfig={{
          component: RCTCustomWebView,
          props: {
            uploadEnabled: true,
            downloadEnabled: true,
            webContentsDebuggingEnabled: true
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
