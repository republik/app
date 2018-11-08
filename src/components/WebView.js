import React, { Fragment } from 'React'
import {
  AppState,
  Text, View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  ActivityIndicator,
  Share,
  Vibration,
  Linking,
  StatusBar,
  NetInfo
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
import {
  FRONTEND_HOST,
  OFFERS_PATH, SIGN_IN_PATH, SIGN_IN_URL,
  USER_AGENT
} from '../constants'
import withT from '../utils/withT'
import mkDebug from '../utils/debug'
import Config from 'react-native-config'
import ReactNativeHaptic from 'react-native-haptic'

const debug = mkDebug('WebView')

const NativeWebView = Platform.select({
  ios: IOSWebView,
  android: AndroidWebView
})

const RELOAD_TIME_THRESHOLD = 60 * 60 * 1000 // 1hr
const RESTRICTED_PATHS = [OFFERS_PATH]
const PERMITTED_PROTOCOLS = ['react-js-navigation']

const normalizeHost = host => host.replace(/^www\./, '')

const isExternalURL = ({ host, protocol }) => (
  normalizeHost(FRONTEND_HOST) !== normalizeHost(host) &&
  !PERMITTED_PROTOCOLS.includes(protocol)
)

const isAllowedUrl = url => {
  const urlObject = typeof url === 'string'
    ? parseUrl(url)
    : url

  return !isExternalURL(urlObject) && !RESTRICTED_PATHS.includes(urlObject.pathname)
}

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

const LoadingState = () => (
  <View style={styles.container}>
    <ActivityIndicator color='#999' size='large' />
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
    this.state = {
      webInstance: 1,
      currentUrl: isAllowedUrl(props.source.uri)
        ? props.source.uri
        : SIGN_IN_URL,
      loading: true
    }
    this.webview = { ref: null, uri: props.source.uri, canGoBack: false }

    this.shouldReload = false
    this.lastActiveDate = null
  }

  componentWillMount () {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPress)
    }
    AppState.addEventListener('change', this.handleAppStateChange)
  }

  componentWillReceiveProps (nextProps) {
    const nextUrl = parseUrl(nextProps.source.uri)
    const previousUrl = parseUrl(this.props.source.uri)

    if (
      (nextProps.me && nextProps.me.id) !== (this.props.me && this.props.me.id)
    ) {
      this.shouldReload = 'hard'
    }

    // If url host changes, we force the redirect
    // This might happen when user change settings in ios
    if (nextProps.forceRedirect || nextUrl.host !== previousUrl.host) {
      debug('forceRedirect', nextProps.source.uri)
      return this.setState({
        currentUrl: isAllowedUrl(nextProps.source.uri)
          ? nextProps.source.uri
          : SIGN_IN_URL
      })
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
    AppState.removeEventListener('change', this.handleAppStateChange)
    this.clearSubscriptions()
  }

  postMessage = message => {
    debug('postMessage', message.type, message.url || message.id)
    this.webview.ref.postMessage(JSON.stringify(message))
  }

  reload = () => {
    this.webview.ref.reload()
  }

  reloadIfNecessary = ({ url, urlObject }) => {
    if (!this.shouldReload) {
      return false
    }

    if (
      urlObject.pathname !== SIGN_IN_PATH
    ) {
      if (this.shouldReload === 'hard') {
        debug('reload hard')
        this.setState({
          loading: true,
          currentUrl: url,
          // hard reload: re-init webview
          webInstance: this.state.webInstance + 1
        })
        this.shouldReload = false
        return true
      } else if (this.shouldReload === 'soft') {
        const netInfo = NetInfo.isConnected.fetch()
        this.setState({
          currentUrl: url
        }, () => {
          netInfo.then(isConnected => {
            if (isConnected && this.shouldReload === 'soft') {
              debug('reload soft')
              this.shouldReload = false
              // soft reload: just trigger reload
              this.webview.ref.reload()
            }
          })
        })
        return undefined
      }
    }
    return false
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState.match(/inactive|background/)) {
      this.lastActiveDate = Date.now()
    } else {
      if (this.lastActiveDate) {
        const shouldReload = Date.now() - this.lastActiveDate > RELOAD_TIME_THRESHOLD

        if (shouldReload && !this.shouldReload) {
          this.shouldReload = 'soft'
        }
      }
    }
  }

  onShouldStartLoadWithRequest = ({ url }) => {
    if (Config.ENV === 'development') {
      // the development next.js front end requests about:blank
      // - maybe related to web hot reloading
      // - the exact source of those requests is unclear
      // - does not happen when running a prd next.js server locally
      if (url === 'about:blank') {
        return true
      }
    }

    const urlObject = parseUrl(url)

    const { onShouldLoad } = this.props
    const shouldOpenInSystemBrowser = !isAllowedUrl(urlObject)
    if (shouldOpenInSystemBrowser) {
      // we open it in system browser
      Linking.openURL(url)
    }
    let shouldLoad = !shouldOpenInSystemBrowser
    if (
      shouldLoad &&
      onShouldLoad
    ) {
      shouldLoad = onShouldLoad({ url, urlObject })
    }
    if (shouldLoad) {
      shouldLoad = !this.reloadIfNecessary({ url, urlObject })
    }
    debug('onShouldStartLoadWithRequest', shouldLoad, url)
    return shouldLoad
  }

  // onNavigationStateChange callback
  // - native when server side navigation
  // - via onMessage when client side navigation
  onNavigationStateChange = ({ url, canGoBack, onMessage }) => {
    debug('onNavigationStateChange', url, { canGoBack, onMessage, shouldReload: this.shouldReload })
    const { onShouldLoad } = this.props

    this.webview.canGoBack = this.webview.canGoBack || canGoBack

    const urlObject = parseUrl(url)
    if (this.webview.uri !== url) {
      this.webview.uri = url

      const shouldOpenInSystemBrowser = !isAllowedUrl(urlObject)
      let shouldOpen = !shouldOpenInSystemBrowser

      if (
        shouldOpen &&
        onShouldLoad
      ) {
        shouldOpen = onShouldLoad({ url, urlObject })
      }

      if (!shouldOpen) {
        if (shouldOpenInSystemBrowser) {
          // we open it in system browser
          Linking.openURL(url)
        }
        // prevent webview to go there
        this.webview.ref.stopLoading()
        this.onLoadStop()

        // and force back when based on a postMessage (stopLoading won't stop history.pushState)
        if (onMessage) {
          this.webview.ref.goBack()
        }
        return false
      }
    }
    this.reloadIfNecessary({ url, urlObject })

    return true
  }

  onLoadStart = () => {
    debug('onLoadStart', { loading: this.state.loading })
    if (!this.state.loading && Platform.OS === 'ios') {
      StatusBar.setNetworkActivityIndicatorVisible(true)
    }
    if (this.props.onLoadStart) {
      this.props.onLoadStart()
    }
  }

  onLoadStop = () => {
    debug('onLoadStop')
    if (Platform.OS === 'ios') {
      StatusBar.setNetworkActivityIndicatorVisible(false)
    }
  }

  onLoadEnd = () => {
    debug('onLoadEnd')

    if (this.state.loading) {
      this.setState({
        loading: false
      })
    }
    if (Platform.OS === 'ios') {
      StatusBar.setNetworkActivityIndicatorVisible(false)
    }

    if (this.props.onLoadEnd) {
      this.props.onLoadEnd()
    }
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
      }
    }

    // User logs in
    if (operations.includes('me')) {
      const newMe = data.data.me
      if (newMe && (!me || (newMe.id !== me.id))) {
        await this.signInClient(newMe)
      }

      // User got unauthenticated
      if (!newMe && me) {
        await this.signOutClient()
      }
    }
  }

  signInClient = async (user) => {
    debug('signInClient', user.email)

    await this.props.clientSignIn({ variables: { user: { id: user.id } } })
    const { onSignIn } = this.props
    if (onSignIn) {
      onSignIn()
    }
  }

  signOutClient = async () => {
    debug('signOutClient')
    await this.props.clientSignOut()
  }

  loadInitialState = (payload) => {
    const { me } = this.props

    debug('loadInitialState', 'props.me', !!me, 'payload.me', !!payload.me)
    if (payload.me && (!me || payload.me.id !== me.id)) {
      return this.signInClient(payload.me)
    }

    if (!payload.me && me) {
      return this.signOutClient()
    }
  }

  handleGraphQLRequest = async (message) => {
    const data = await makePromise(execute(link, message.data.payload))

    await this.onGraphQLResponse({ ...message.data.payload, data })

    this.postMessage({ id: message.data.id, type: 'graphql', payload: data })
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
    const { currentUrl, webInstance, loading } = this.state
    const { onFileChooserOpen } = this.props

    return (
      <Fragment>
        { loading && <LoadingState /> }
        <NativeWebView
          key={webInstance}
          source={{ uri: currentUrl }}
          ref={node => { this.webview.ref = node }}
          onMessage={this.onMessage}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
          onNavigationStateChange={this.onNavigationStateChange}
          renderError={() => <ErrorState onReload={this.reload} />}
          userAgent={USER_AGENT}
          automaticallyAdjustContentInsets={false}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={this.onLoadEnd}
          onLoadStart={this.onLoadStart}
          onFileChooserOpen={onFileChooserOpen}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          keyboardDisplayRequiresUserAction={false}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={false}
          startInLoadingState
          javaScriptEnabled
          sendCookies
        />
        {/* We're using a WKWebView fork with hard coded allowsInlineMediaPlayback: the above flag has no effect. */}
        {/* Consider hideKeyboardAccessoryView once we can avoid the keyboard */}
      </Fragment>
    )
  }
};

WebView.defaultProps = {
  onFileChooserOpen: () => {}
}

export default compose(
  withMe,
  withClientSignIn,
  withClientSignOut
)(WebView)
