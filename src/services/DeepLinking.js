import { useEffect } from 'react'
import { Linking, Platform } from 'react-native'

import { useGlobalState } from '../GlobalState'
import { rewriteBaseUrl, devLog } from '../constants'

const DeepLinkingService = () => {
  const { setGlobalState } = useGlobalState()

  useEffect(() => {
    const handleOpenURL = ({ url }) => {
      devLog('handleOpenURL', url)
      // Don't navigate if trackplayer url
      if (url === 'trackplayer://notification.click') {
        return
      }
      setGlobalState({ pendingUrl: rewriteBaseUrl(url) })
    }


    const onInitialUrl = (url) => {
      if (url) {
        handleOpenURL({ url })
      }
      setGlobalState({ deepLinkingReady: true })
    }
    const onInitialError = (error) => {
      console.error('getInitialURL', error)
      setGlobalState({ deepLinkingReady: true })
    }

    if (Platform.OS === 'android') {
      // work around regular Linking.getInitialURL promise never returning after a force quite
      // https://github.com/facebook/react-native/issues/25675#issuecomment-612249911
      const NativeLinking = require('react-native/Libraries/Linking/NativeLinking').default
      NativeLinking.getInitialURL().then(onInitialUrl).catch(onInitialError)
    } else {
      Linking.getInitialURL().then(onInitialUrl).catch(onInitialError)
    }

    Linking.addEventListener('url', handleOpenURL)
    return () => {
      Linking.removeEventListener('url', handleOpenURL)
    }
  }, [setGlobalState])

  return null
}

export default DeepLinkingService
