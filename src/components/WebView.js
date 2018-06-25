import React, { Fragment } from 'React'
import { Text, View, Image, StyleSheet, TouchableOpacity, Platform, BackHandler } from 'react-native'
import WebView from 'react-native-wkwebview-reborn'
import Spinner from 'react-native-spinkit'
import { parse } from 'graphql'
import { execute, makePromise } from 'apollo-link'
import { listenHistory } from '../utils/webHistory'
import { link } from '../apollo'
import withT from '../utils/withT'

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
  spinnerContainer: {
    position: 'relative'
  },
  loadingLogo: {
    width: 90,
    height: 90,
    top: 20,
    left: 20,
    position: 'absolute'
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

const LoadingState = () => (
  <View style={styles.container}>
    <View styles={styles.spinnerContainer}>
      <Spinner isVisible size={130} type="Arc" color="#DDDDDD" />
      <Image
        style={styles.loadingLogo}
        source={require('../assets/images/icon.png')}
      />
    </View>
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

class CustomWebView extends React.PureComponent {
  constructor (props) {
    super(props)

    this.subscriptions = {}
    this.webview = { ref: null, uri: props.source.uri, canGoBack: false }
  }

  componentWillMount () {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPress)
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

  onMessage = e => {
    const { onMessage } = this.props
    const message = JSON.parse(e.nativeEvent.data)

    switch (message.type) {
      case 'navigation':
        return this.onNavigationStateChange(message)
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

  onReload = () => {
    this.webview.ref.reload()
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
    const { loading } = this.props

    return (
      <Fragment>
        { loading && <LoadingState /> }
        <WebView
          {...this.props}
          ref={node => { this.webview.ref = node }}
          onMessage={this.onMessage}
          onNavigationStateChange={this.onNavigationStateChange}
          renderError={() => <ErrorState onReload={this.onReload} />}
          automaticallyAdjustContentInsets={false}
          injectedJavaScript={listenHistory}
          allowsBackForwardNavigationGestures
          scalesPageToFit={false}
          userAgent="RepublikApp"
          startInLoadingState
          javaScriptEnabled
          sendCookies
        />
      </Fragment>
    )
  }
};

export default CustomWebView
