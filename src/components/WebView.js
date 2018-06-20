import React, { Fragment } from 'React'
import { Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native'
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
  subscriptions = {}

  postMessage = message => {
    this.instance.postMessage(JSON.stringify(message))
  }

  // Native onNavigationStateChange method shim.
  // We call onNavigationStateChange either when the native calls, or onMessage
  onNavigationStateChange = ({ url }) => {
    const { source, onNavigationStateChange } = this.props

    if (source.uri !== url && onNavigationStateChange) {
      const shouldFollowRedirect = onNavigationStateChange({ url })

      // Native WebView does not have a way of preventing a page to load
      // so we go back into the webview's history that has the same effect.
      if (!shouldFollowRedirect) {
        this.instance.goBack()
      }
    }
  }

  onMessage = e => {
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
        console.log(message)
        console.warn(`Unhandled message of type: ${message.type}`)
    }
  }

  handleGraphQLRequest = async (message) => {
    const { onNetwork } = this.props
    const data = await makePromise(execute(link, message.data.payload))

    if (onNetwork) {
      await onNetwork({ ...message.data.payload, data })
    }

    this.postMessage({ id: message.data.id, payload: data })
  }

  handleGraphQLSubscription = (message) => {
    switch (message.type) {
      case 'stop':
        this.subscriptions[message.id].unsubscribe()
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
    this.instance.reload()
  }

  render () {
    const { loading } = this.props

    return (
      <Fragment>
        { loading && <LoadingState /> }
        <WebView
          {...this.props}
          ref={node => { this.instance = node }}
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
