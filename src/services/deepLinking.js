import React, { Component } from 'react'
import { Linking } from 'react-native'
import { withApollo, compose } from 'react-apollo'
import { parse, format } from 'url'
import { FRONTEND_BASE_URL, NOTIFICATIONS_PATH } from '../constants'
import navigator from './navigation'
import { setUrl } from '../apollo'

const deepLinkingWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      // This handles the case where the app is closed and is launched via Universal Linking.
      Linking.getInitialURL().then((url) => {
        if (url) this.handleOpenURL({ url })
      })

      Linking.addEventListener('url', this.handleOpenURL)
    }

    componentWillUnmount () {
      Linking.removeEventListener('url', this.handleOpenURL)
    }

    handleOpenURL = (event) => {
      const { path, pathname } = parse(event.url || '')

      // When deep/universal link opened, we edit
      //   the global url state to show correct page
      setTimeout(() => {
        const url = `${FRONTEND_BASE_URL}${path}`
        if (pathname === NOTIFICATIONS_PATH) {
          navigator.navigate('Login', { url })
        } else {
          this.props.setUrl({
            variables: { url }
          })
        }
      }, 100)
    }

    render () {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
)

export default compose(setUrl, deepLinkingWrapper)
