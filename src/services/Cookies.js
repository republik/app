import React, { useEffect } from 'react'
import CookieManager from '@react-native-community/cookies'
import { FRONTEND_BASE_URL, CURTAIN_BACKDOOR_PATH } from '../constants'

// Requires sharedCookiesEnabled={true} prop to be set on WebView

const CookieService = () => {
  useEffect(() => {
    const setCookies = async () => {
      if (CURTAIN_BACKDOOR_PATH) {
        let cookies = `OpenSesame=${encodeURIComponent(
          CURTAIN_BACKDOOR_PATH,
        )}; Path=/; Expires=Thu, 01 Jan 2030 00:00:00 GMT; HttpOnly`

        await CookieManager.setFromResponse(FRONTEND_BASE_URL, cookies).then(
          (success) => {
            console.log('CookieManager.setFromResponse =>', cookies)
          },
        )
      }
    }
    setCookies()
  }, [])

  return null
}

export default CookieService
