import React, { Component } from 'react'
import { AsyncStorage } from 'react-native'
import { compose } from 'react-apollo'
import { withCurrentUrl, logout } from '../apollo'
import { FRONTEND_BASE_URL } from '../constants'

const settingsWrapper = WrappedComponent => (
  class extends Component {
    async componentDidMount () {
      const applicationPreference = FRONTEND_BASE_URL
      const previousApplicationPreference = await AsyncStorage.getItem('application_url')

      if (
        previousApplicationPreference &&
        applicationPreference !== previousApplicationPreference
      ) {
        this.props.logout()
      }

      await AsyncStorage.setItem('application_url', applicationPreference)
    }

    render () {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
)

export default compose(
  logout,
  withCurrentUrl,
  settingsWrapper
)
