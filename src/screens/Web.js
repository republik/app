import React, { useRef, useState, useEffect } from 'react'
import { WebView } from 'react-native-webview'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Share, Platform, BackHandler } from 'react-native'
import { APP_VERSION, FRONTEND_BASE_URL } from '../constants'
import { useGlobalState } from '../GlobalState'
import SplashScreen from 'react-native-splash-screen'
import Loader from '../components/Loader'
import { useColorContext } from '../utils/colors'

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
  const [showLoader, setShowLoader] = useState(true)
  const { colors } = useColorContext()

  // Make sure loader is only shown on first mount
  useEffect(() => {
    if (isReady && showLoader) {
      setShowLoader(false)
    }
  }, [isReady, showLoader])

  // Capture Android back button press
  useEffect(() => {
    const CurrentWebView = webviewRef.current
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', CurrentWebView.goBack())
    }
    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener(
          'hardwareBackPress',
          CurrentWebView.goBack(),
        )
      }
    }
  }, [])

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
      // navigate to pendingUrl a service
      // the date is added so that when a page is set via setWebUrl
      // and a user navigates away but then tries to return to the page
      // (e.g. via AudioPlayer Title-Link), the state change is registered
      setWebUrl(`${globalState.pendingUrl}?t=${Date.now()}`)
      setGlobalState({ pendingUrl: null })
    } else if (!webUrl) {
      // if nothing is pending navigate to saved url
      // - which also has a default
      setWebUrl(persistedState.url)
    }

    if (!webUrl) {
      SplashScreen.hide()
    }
  }, [webUrl, globalState, persistedState, setGlobalState])

  useEffect(() => {
    if (!isReady) {
      return
    }
    const message = pendingMessages.filter((msg) => !msg.mark)[0]
    if (!message) {
      return
    }
    console.log('postMessage', message)
    webviewRef.current.postMessage(JSON.stringify(message))
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

  const onMessage = (e) => {
    const message = JSON.parse(e.nativeEvent.data) || {}
    console.log('onMessage', message)
    if (message.type === 'share') {
      share(message.payload)
    } else if (message.type === 'play-audio') {
      setPersistedState({
        audio: message.payload.audio,
        currentMediaTime: message.payload.currentTime,
      })
    } else if (message.type === 'isSignedIn') {
      setPersistedState({ isSignedIn: message.payload })
    } else if (message.type === 'fullscreen-enter') {
      setPersistedState({ isFullscreen: true })
    } else if (message.type === 'fullscreen-exit') {
      setPersistedState({ isFullscreen: false })
    } else if (message.type === 'setColorScheme') {
      setPersistedState({ userSetColorScheme: message.colorSchemeKey })
    } else if (message.type === 'ackMessage') {
      dispatch({
        type: 'clearMessage',
        id: message.id,
      })
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
      alert(error.message)
    }
  }

  return (
    <>
      {webUrl && (
        <SafeAreaView
          style={{ flex: 1 }}
          edges={['right', 'left']}
          backgroundColor={
            persistedState.isFullscreen
              ? colors.fullScreenStatusBar
              : colors.default
          }>
          <WebView
            ref={webviewRef}
            source={{ uri: webUrl }}
            applicationNameForUserAgent={`RepublikApp/${APP_VERSION}`}
            onNavigationStateChange={({ url }) => {
              console.log('onNavigationStateChange', url)
              setPersistedState({ url })
            }}
            onMessage={(e) => onMessage(e)}
            onLoadStart={() => {
              console.log('onLoadStart', 'ready', false)
              setIsReady(false)
            }}
            onLoad={() => {
              console.log('onLoad', 'ready', true)
              setIsReady(true)
            }}
            originWhitelist={[`${FRONTEND_BASE_URL}*`]}
            pullToRefreshEnabled={false}
            bounce={false}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            sharedCookiesEnabled={true}
            allowsBackForwardNavigationGestures={true}
            automaticallyAdjustContentInsets={false}
            keyboardDisplayRequiresUserAction={false}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
          />
        </SafeAreaView>
      )}
      {showLoader && !isReady && <Loader loading={!isReady} />}
    </>
  )
}

export default Web
