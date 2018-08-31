import React, { Fragment } from 'React'
import { 
  Text, View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  ActivityIndicator,
  Share,
  Vibration,
  Linking
} from 'react-native'
import IOSWebView from 'react-native-wkwebview-reborn'
import { parse } from 'graphql'
import { compose } from 'react-apollo'
import { parse as parseUrl } from 'url'
import { execute, makePromise } from 'apollo-link'
import AndroidWebView from './AndroidWebView'
import { injectedJavaScript } from '../utils/webview'
import {
  link,
  withMe,
  withClientSignIn,
  withClientSignOut
} from '../apollo'
import { FRONTEND_HOST, FEED_PATH, OFFERS_PATH, USER_AGENT } from '../constants'
import withT from '../utils/withT'
import mkDebug from '../utils/debug'
import Config from 'react-native-config'
import ReactNativeHaptic from 'react-native-haptic'

const debug = mkDebug('WebView')

const NativeWebView = Platform.select({
  ios: IOSWebView,
  android: AndroidWebView
})

const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']

const isExternalURL = ({ host, protocol }) => (
  FRONTEND_HOST !== host &&
  !PERMITTED_PROTOCOLS.includes(protocol)
)

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
    padding: 25,
    backgroundColor: '#E9A733'
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'GT America'
  },
  errorText: {
    color: '#FFF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'GT America'
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
    <Text style={styles.errorTitle}>{t('webview/error/title')}</Text>
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
    this.webview = { ref: null, uri: props.source.uri, canGoBack: false }
  }

  componentWillMount () {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPress)
    }
  }

  componentWillReceiveProps (nextProps) {
    const nextUrl = parseUrl(nextProps.source.uri)
    const previousUrl = parseUrl(this.props.source.uri)

    // If url host changes, we force the redirect
    // This might happen when user change settings in ios
    if (nextProps.forceRedirect || nextUrl.host !== previousUrl.host) {
      debug('forceRedirect', nextProps.source.uri)
      return this.setState({ currentUrl: nextProps.source.uri })
    }

    if (
      nextProps.source.uri !== this.props.source.uri &&
      nextProps.source.uri !== this.webview.uri
    ) {
      this.postMessage({ type: 'push-route', url: nextUrl.path })
    }
  }

  clearSubscriptions () {
    Object.keys(this.subscriptions).forEach(key => {
      const subscription = this.subscriptions[key]
      if (subscription) {
        subscription.unsubscribe()
      }
    })
    this.subscriptions = {}
  }

  componentWillUnmount () {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress')
    }
    this.clearSubscriptions()
  }

  postMessage = message => {
    debug('postMessage', message.type, message.url || message.id)
    this.webview.ref.postMessage(JSON.stringify(message))
  }

  reload = () => {
    this.setState({ currentUrl: this.props.source.uri })
    this.webview.ref.reload()
  }

  // onNavigationStateChange callback
  // - native when server side navigation
  // - via onMessage when client side navigation
  onNavigationStateChange = ({ url, canGoBack, onMessage }) => {
    debug('onNavigationStateChange', url, {canGoBack, onMessage})
    const { onNavigationStateChange, onLoadStop } = this.props

    this.webview.canGoBack = this.webview.canGoBack || canGoBack

    if (this.webview.uri !== url) {
      this.webview.uri = url

      const urlObject = parseUrl(url)
      let shouldOpen = (
        !isExternalURL(urlObject) &&
        !RESTRICTED_PATHS.includes(urlObject.pathname)
      )

      if (
        shouldOpen &&
        onNavigationStateChange
      ) {
        shouldOpen = onNavigationStateChange({ url, urlObject })
      }

      if (!shouldOpen) {
        // we open it in system browser
        Linking.openURL(url)
        // and prevent webview to go there
        this.webview.ref.stopLoading()
        if (onLoadStop) {
          onLoadStop()
        }

        // and force back when navigating on message
        if (onMessage) {
          this.webview.ref.goBack()
        }
        return false
      }
    }

    return true
  }

  share = ({ url, title, message, subject, dialogTitle }) => {
    Share.share(Platform.OS === 'ios' ? {
      url,
      title,
      subject,
      message
    } : {
      dialogTitle,
      title,
      message: [message, url].filter(Boolean).join('\n')
    })
  }

  vibrate (payload = {}) {
    if (payload.cancel) {
      Vibration.cancel()
    } else {
      Vibration.vibrate(
        payload.pattern || 1000,
        payload.repeat
      )
    }
  }

  haptic (payload = {}) {
    if (payload.prepare) {
      ReactNativeHaptic.prepare()
    } else {
      ReactNativeHaptic.generate(payload.type)
    }
  }

  onMessage = e => {
    const { onMessage } = this.props

    let message
    try {
      message = JSON.parse(e.nativeEvent.data)
    } catch (error) {}
    // handle null and undefined
    // - remember that typeof null === 'object'
    if (!message) {
      message = {}
    }

    switch (message.type) {
      case 'initial-state':
        // a new apollo client was initiated
        // - unsubscribe from all previously active subscriptions
        this.clearSubscriptions()
        return this.loadInitialState(message.payload)
      case 'navigation':
        debug('onMessage', message.type, message.url)
        return this.onNavigationStateChange({
          ...message,
          onMessage: true
        })
      case 'share':
        debug('onMessage', message.type, message.payload.url)
        return this.share(message.payload)
      case 'graphql':
        debug('onMessage', message.type, message.data.id)
        return this.handleGraphQLRequest(message)
      case 'start':
      case 'stop':
        debug('onMessage', message.type, message.id)
        return this.handleGraphQLSubscription(message)
      case 'log':
        console.log('Webview Log:', message.data)
        break
      case 'warning':
        console.log(message)
        console.warn([
          'Webview Warning',
          message.data && message.data && message.data.error
        ].filter(Boolean).join(': '))
        break
      case 'vibrate':
        debug('onMessage', message.type, JSON.stringify(message.payload))
        return this.vibrate(message.payload)
      case 'haptic':
        debug('onMessage', message.type, JSON.stringify(message.payload))
        return this.haptic(message.payload)
      default:
        if (Config.ENV === 'development') {
          const payload = JSON.stringify(message.payload)
          debug(
            'onMessage', 
            message.type,
            payload && payload.length > 80
              ? payload.slice(0, 80) + '...'
              : payload
          )
        }
        onMessage && onMessage(message)
    }
  }

  onGraphQLResponse = async ({ query, data }) => {
    const { me } = this.props
    const { definitions } = query
    const operations = definitions.map(definition => definition.name && definition.name.value)

    debug('onGraphQLResponse', operations, Object.keys(data.data).map(key => [key, !!data.data[key]]))

    if (operations.includes('signOut')) {
      if (me) {
        await this.signOutClient()
        return false
      }
    }

    // User logs in
    if (operations.includes('me')) {
      const newMe = data.data.me
      if (newMe && (!me || (newMe !== me.id))) {
        await this.signInClient(newMe)
        return false
      }

      // User got unauthenticated
      if (!newMe && me) {
        await this.signOutClient()
        return false
      }
    }
    return true
  }

  signInClient = async (user, { reload = true } = {}) => {
    debug('signInClient', user.email, { reload })

    await this.props.clientSignIn({ variables: { user: { id: user.id } } })

    const { onSignIn } = this.props
    if (onSignIn) {
      onSignIn()
    }
  }

  signOutClient = async ({ reload = true } = {}) => {
    debug('signOutClient', { reload })
    await this.props.clientSignOut()
  }

  loadInitialState = (payload) => {
    const { me } = this.props

    debug('loadInitialState', 'props.me', !!me, 'payload.me', !!payload.me)
    if (payload.me && (!me || payload.me.id !== me.id)) {
      return this.signInClient(payload.me, { reload: true })
    }

    if (!payload.me && me) {
      return this.signOutClient({ reload: false })
    }
  }

  handleGraphQLRequest = async (message) => {
    const data = await makePromise(execute(link, message.data.payload))

    const forward = await this.onGraphQLResponse({ ...message.data.payload, data })

    if (forward) {
      this.postMessage({ id: message.data.id, type: 'graphql', payload: data })
    }
  }

  handleGraphQLSubscription = (message) => {
    switch (message.type) {
      case 'stop':
        const subscription = this.subscriptions[message.id]
        if (subscription) {
          subscription.unsubscribe()
        }
        delete this.subscriptions[message.id]
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
    const { loading, onLoadEnd, onLoadStart, onFileChooserOpen } = this.props

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
  loading: {},
  onFileChooserOpen: () => {}
}

export default compose(
  withMe,
  withClientSignIn,
  withClientSignOut
)(WebView)
