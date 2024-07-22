import React, { useRef, useState, useEffect } from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView } from 'react-native-safe-area-context'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import {
  StyleSheet,
  Share,
  Platform,
  BackHandler,
  StatusBar,
} from 'react-native'
import SplashScreen from 'react-native-splash-screen'

import {
  APP_VERSION,
  FRONTEND_BASE_URL,
  HOME_URL,
  devLog,
  BUILD_NUMBER,
} from '../constants'
import { useGlobalState } from '../GlobalState'
import NetworkError from './NetworkError'
import Loader from '../components/Loader'
import { useColorContext } from '../utils/colors'
import WebViewEventEmitter from '../lib/WebViewEventEmitter'

// Based on react-native-webview injection for Android
// https://github.com/react-native-webview/react-native-webview/blob/194c6a2335b12cc05283413c44d0948eb5156e02/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManager.java#L651-L670
const generateMessageJS = data => {
  return [
    '(function(){',
    'var event;',
    `var data = ${JSON.stringify(data)};`,
    'try{',
    'event = new MessageEvent("message",{data});',
    '}catch(e){',
    'event = document.createEvent("MessageEvent");',
    'event.initMessageEvent("message",true,true,data,"","",window);',
    '}',
    'document.dispatchEvent(event);',
    '})();',
  ].join('')
}

const getLast = array => array[array.length - 1]

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
})

const Web = () => {
  const {
    globalState,
    setGlobalState,
    persistedState,
    setPersistedState,
    pendingMessages,
    dispatch,
  } = useGlobalState()
  const webviewRef = useRef()
  const [webUrl, setWebUrl] = useState()
  const [isReady, setIsReady] = useState(false)
  const { colors, colorSchemeKey } = useColorContext()

  const [history, setHistory] = useState([])
  const historyRef = useRef()
  historyRef.current = history

  const { appState } = globalState
  const [didCrash, setDidCrash] = useState()

  useEffect(() => {
    if (didCrash && appState === 'active') {
      webviewRef.current.reload()
      setDidCrash(false)
    }
  }, [appState, didCrash])

  // Android web view does not support media queries
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    // there for we send the os/app color scheme to the web app
    dispatch({
      type: 'postMessage',
      content: {
        type: 'osColorScheme',
        value: colorSchemeKey,
      },
    })
  }, [colorSchemeKey, dispatch])

  // Capture Android back button press
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    const backAction = () => {
      const currentHistory = historyRef.current
      if (currentHistory.length === 1 && getLast(currentHistory) === HOME_URL) {
        BackHandler.exitApp()
        return false
      }
      if (currentHistory.length) {
        dispatch({
          type: 'postMessage',
          content: {
            type: 'back',
          },
        })
        // needs to happen after setGlobalState because set happens instantaneously instant in react native
        setHistory(currentHistory.slice(0, currentHistory.length - 1))
        return true
      }
      setGlobalState({ pendingUrl: HOME_URL })
      return true
    }
    BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress')
    }
  }, [setGlobalState, dispatch])

  useEffect(() => {
    // wait for all services
    if (
      !globalState.deepLinkingReady ||
      !globalState.pushReady ||
      !globalState.persistedStateReady ||
      !globalState.cookiesReady
    ) {
      return
    }
    if (globalState.pendingUrl) {
      if (webUrl) {
        dispatch({
          type: 'postMessage',
          content: {
            type: 'push-route',
            url: globalState.pendingUrl.replace(FRONTEND_BASE_URL, ''),
          },
        })
      } else {
        setWebUrl(globalState.pendingUrl)
      }
      setGlobalState({ pendingUrl: null })
    } else if (!webUrl) {
      // if nothing is pending navigate to saved url
      setWebUrl(
        // handle env changes or illegal navigations
        persistedState.url?.startsWith(FRONTEND_BASE_URL)
          ? persistedState.url
          : HOME_URL,
      )
    }

    if (!webUrl) {
      SplashScreen.hide()
    }
  }, [webUrl, globalState, persistedState, setGlobalState, dispatch])

  useEffect(() => {
    if (!isReady) {
      return
    }
    const message = pendingMessages.filter(msg => !msg.mark)[0]
    if (!message) {
      return
    }
    devLog('postMessage', message)
    webviewRef.current.injectJavaScript(generateMessageJS(message))
    dispatch({
      type: 'markMessage',
      id: message.id,
      mark: true,
    })
    setTimeout(() => {
      dispatch({
        type: 'markMessage',
        id: message.id,
        mark: false,
      })
    }, 5 * 1000)
  }, [isReady, pendingMessages, dispatch])

  const onMessage = e => {
    const message = JSON.parse(e.nativeEvent.data) || {}
    devLog('onMessage', message)
    switch (message.type) {
      case 'routeChange':
        onNavigationStateChange(message.payload)
        break
      case 'share':
        share(message.payload)
        break
      case 'haptic':
        ReactNativeHapticFeedback.trigger(message.payload.type)
        break
      case 'play-audio':
        setGlobalState({ autoPlayAudio: message.payload })
        setPersistedState({
          audio: message.payload,
        })
        break
      case 'isSignedIn':
        setPersistedState({ isSignedIn: message.payload })
        break
      case 'fullscreen-enter':
        setGlobalState({ isFullscreen: true })
        break
      case 'fullscreen-exit':
        setGlobalState({ isFullscreen: false })
        break
      case 'setColorScheme':
        setPersistedState({ userSetColorScheme: message.colorSchemeKey })
        break
      case 'ackMessage':
        dispatch({
          type: 'clearMessage',
          id: message.id,
        })
        break
      default:
        // Forward to an EventEmitter to directly handle the event
        // in the respective component
        WebViewEventEmitter.emit(message.type, message.payload)
    }
  }

  const share = async ({ url, title, message, subject, dialogTitle }) => {
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? {
              url,
              title,
              subject,
              message,
            }
          : {
              dialogTitle,
              title,
              message: [message, url].filter(Boolean).join('\n'),
            },
      )
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error.message)
    }
  }

  const onNavigationStateChange = ({ url: urlInput }) => {
    const url = urlInput.startsWith(FRONTEND_BASE_URL)
      ? urlInput
      : `${FRONTEND_BASE_URL}${urlInput}`
    // deduplicate
    // - called by onMessage routeChange and onNavigationStateChange
    //   - iOS triggers onNavigationStateChange for pushState in the web view
    //   - Android does not
    // - onNavigationStateChange is still necessary
    //   - for all route changes via pendingUrl
    //   - e.g. notifications & link opening
    if (url !== persistedState.url) {
      setPersistedState({ url })
    }
    if (getLast(history) !== url) {
      setHistory(currentHistory => {
        if (getLast(currentHistory) === url) {
          return currentHistory
        }
        return currentHistory.concat(url)
      })
    }
  }

  return (
    <>
      {webUrl && (
        <SafeAreaView
          style={styles.webView}
          edges={['right', 'left']}
          backgroundColor={
            globalState.isFullscreen
              ? colors.fullScreenStatusBar
              : colors.default
          }>
          <WebView
            ref={webviewRef}
            source={{ uri: webUrl }}
            applicationNameForUserAgent={`RepublikApp/${APP_VERSION}/${BUILD_NUMBER}`}
            onNavigationStateChange={onNavigationStateChange}
            onMessage={onMessage}
            onLoad={() => {
              setIsReady(true)
            }}
            onLoadStart={({ nativeEvent }) => {
              if (isReady && nativeEvent.loading && Platform.OS === 'ios') {
                StatusBar.setNetworkActivityIndicatorVisible(true)
              }
            }}
            onLoadEnd={({ nativeEvent }) => {
              if (Platform.OS === 'ios') {
                StatusBar.setNetworkActivityIndicatorVisible(false)
              }
            }}
            startInLoadingState
            renderLoading={() => <Loader loading />}
            renderError={() => (
              <NetworkError onReload={() => webviewRef.current.reload()} />
            )}
            // stripe url's are included to enable prolong
            // delete once shop.republik.ch is live
            originWhitelist={[
              `${FRONTEND_BASE_URL}*`,
              'https://js.stripe.com',
              'https://*.stripecdn.com',
              'https://newassets.hcaptcha.com',
            ]}
            pullToRefreshEnabled={false}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            sharedCookiesEnabled={true}
            allowsBackForwardNavigationGestures={true}
            automaticallyAdjustContentInsets={false}
            keyboardDisplayRequiresUserAction={false}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
            decelerationRate="normal"
            onRenderProcessGone={() => {
              setDidCrash(true)
            }}
            onContentProcessDidTerminate={() => {
              setDidCrash(true)
            }}
            style={{ backgroundColor: colors.default }}
          />
        </SafeAreaView>
      )}
    </>
  )
}

export default Web
