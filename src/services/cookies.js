import React, { Component } from 'react'
import { Platform } from 'react-native'
import CookieManager from 'react-native-cookies'
import { FRONTEND_BASE_URL, CURTAIN_BACKDOOR_PATH } from '../constants'

const cookiesWrapper = WrappedComponent => (
  class extends Component {
    state = { cookiesLoaded: false }

    async componentDidMount () {
      if (CURTAIN_BACKDOOR_PATH) {
        let cookies = `OpenSesame=${encodeURIComponent(CURTAIN_BACKDOOR_PATH)}; Path=/; Expires=Thu, 01 Jan 2030 00:00:00 GMT; HttpOnly`

        if (Platform.OS === 'ios') {
          cookies = { 'Set-Cookie': cookies }
        }

        await CookieManager.setFromResponse(FRONTEND_BASE_URL, cookies)
      }

      this.setState({ cookiesLoaded: true })
    }

    render () {
      if (!this.state.cookiesLoaded) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
)

export default cookiesWrapper
