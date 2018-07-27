import React, { Fragment } from 'React'
import { Text, View, StyleSheet, TouchableOpacity, Platform, BackHandler, ActivityIndicator } from 'react-native'
import IOSWebView from 'react-native-wkwebview-reborn'
import { parse } from 'graphql'
import { execute, makePromise } from 'apollo-link'
import AndroidWebView from './AndroidWebView'
import { parseURL } from '../utils/url'
import { injectedJavaScript } from '../utils/webview'
import { link } from '../apollo'
import { USER_AGENT } from '../constants'
import withT from '../utils/withT'

const NativeWebView = Platform.select({
  ios: IOSWebView,
  android: AndroidWebView
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 0,
    left: 0,
    zIndex: 150,
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#E9A733'
  },
  errorText: {
    color: '#FFF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20
  },
  button: {
    color: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 20,
    borderColor: 'white',
    borderWidth: 1
  }
})

const LoadingState = ({ showSpinner }) => (
  <View style={styles.container}>
    {showSpinner && (
      <ActivityIndicator color="#999" size="large" />
    )}
  </View>
)

const ErrorState = withT(({ t, onReload }) => (
  <View style={[styles.container, styles.errorContainer]}>
    <Text style={styles.errorText}>{t('webview/error/title')}</Text>
    <Text style={styles.errorText}>{t('webview/error/description')}</Text>
    <TouchableOpacity onPress={onReload} >
      <Text style={styles.button}>{t('webview/error/reload')}</Text>
    </TouchableOpacity>
  </View>
))

class WebView extends React.PureComponent {
  constructor (props) {
    super(props)

    this.subscriptions = {}
    this.state = { currentUrl: props.source.uri }
    this.webview = { ref: null, uri: props.source.uri, canGoBack: false, scrollY: 0 }
  }

  componentWillMount () {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPress)
    }
  }

  componentWillReceiveProps (nextProps) {
    const nextUrl = parseURL(nextProps.source.uri)
    const previousUrl = parseURL(this.props.source.uri)

    // If url host changes, we force the redirect
    // This might happen when user change settings in ios
    if (nextUrl.host !== previousUrl.host) {
      return this.setState({ currentUrl: nextProps.source.uri })
    }

    if (
      nextProps.source.uri !== this.props.source.uri &&
      nextProps.source.uri !== this.webview.uri
    ) {
      this.postMessage({ type: 'pushRoute', url: nextUrl.path })
    }
  }

  componentWillUnmount () {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress')
    }
  }

  postMessage = message => {
    this.webview.ref.postMessage(JSON.stringify(message))
  }

  reload = () => {
    this.setState({ currentUrl: this.props.source.uri })
    this.webview.ref.reload()
  }

  // Native onNavigationStateChange method shim.
  // We call onNavigationStateChange either when the native calls, or onMessage
  onNavigationStateChange = ({ url, canGoBack }) => {
    const { onNavigationStateChange } = this.props

    this.webview.canGoBack = this.webview.canGoBack || canGoBack

    if (this.webview.uri !== url) {
      this.webview.uri = url

      if (onNavigationStateChange) {
        const shouldFollowRedirect = onNavigationStateChange({ url })

        if (!shouldFollowRedirect) {
          this.webview.ref.stopLoading()
          return false
        }
      }
    }

    return true
  }

  onScrollStateChange = ({ payload }) => {
    // Prevent calling onScroll if this didn't changed (sometimes happens for unknown reason)
    if (
      this.props.onScroll &&
      this.webview.scrollY !== payload.y
    ) {
      this.props.onScroll(payload)
      this.webview.scrollY = payload.y
      return true
    }

    return false
  }

  onMessage = e => {
    const { onMessage } = this.props
    const message = JSON.parse(e.nativeEvent.data)

    switch (message.type) {
      case 'navigation':
        return this.onNavigationStateChange(message)
      case 'scroll':
        return this.onScrollStateChange(message)
      case 'graphql':
        return this.handleGraphQLRequest(message)
      case 'start':
      case 'stop':
        return this.handleGraphQLSubscription(message)
      case 'log':
        console.log('Webview >>>', message.data)
        break
      default:
        onMessage && onMessage(message)
    }
  }

  handleGraphQLRequest = async (message) => {
    const { onNetwork } = this.props
    const data = await makePromise(execute(link, message.data.payload))

    if (onNetwork) {
      await onNetwork({ ...message.data.payload, data })
    }

    this.postMessage({ id: message.data.id, type: 'graphql', payload: data })
  }

  handleGraphQLSubscription = (message) => {
    switch (message.type) {
      case 'stop':
        this.subscriptions[message.id] && this.subscriptions[message.id].unsubscribe()
        break
      case 'start':
        const query = typeof message.payload.query === 'string'
          ? parse(message.payload.query)
          : message.payload.query

        const operation = {
          query,
          operationName: message.payload.operationName,
          variables: message.payload.variables,
          extensions: message.payload.extensions
        }

        this.subscriptions[message.id] = execute(link, operation).subscribe({
          next: data => {
            this.postMessage({ id: message.id, type: 'data', payload: data })
          },
          error: error => {
            this.postMessage({ id: message.id, type: 'error', payload: error })
          },
          complete: () => {
            this.postMessage({ id: message.id, type: 'complete' })
          }
        })
    }
  }

  onAndroidBackPress = () => {
    if (this.webview.canGoBack) {
      this.webview.ref.goBack()
      this.webview.canGoBack = undefined
      return true
    }

    return false
  }

  render () {
    const { currentUrl } = this.state
    const { loading, onLoadEnd, onLoadStart, webViewWillTransition, onFileChooserOpen } = this.props

    return (
      <Fragment>
        { loading.status && <LoadingState {...loading} /> }
        <NativeWebView
          source={{ uri: currentUrl }}
          ref={node => { this.webview.ref = node }}
          onMessage={this.onMessage}
          onNavigationStateChange={this.onNavigationStateChange}
          renderError={() => <ErrorState onReload={this.reload} />}
          userAgent={USER_AGENT}
          automaticallyAdjustContentInsets={false}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={onLoadEnd}
          onLoadStart={onLoadStart}
          webViewWillTransition={webViewWillTransition}
          onFileChooserOpen={onFileChooserOpen}
          allowsBackForwardNavigationGestures
          scalesPageToFit={false}
          startInLoadingState
          javaScriptEnabled
          sendCookies
        />
      </Fragment>
    )
  }
};

WebView.defaultProps = {
  loading: {}
}

export default WebView
