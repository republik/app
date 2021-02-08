import { useEffect } from 'react'
import { Linking } from 'react-native'

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

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleOpenURL({ url })
      }
      setGlobalState({ deepLinkingReady: true })
    })
    Linking.addEventListener('url', handleOpenURL)
    return () => {
      Linking.removeEventListener('url', handleOpenURL)
    }
  }, [setGlobalState])

  return null
}

export default DeepLinkingService
