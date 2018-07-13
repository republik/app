import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {

    }

    componentWillUnmount () {

    }

    onNotificationOpened = ({ notification }) => {
      const data = notification.data || {}

      switch (data.type) {
        case 'discussion':
          return this.props.setUrl({ variables: { url: data.url } })
      }
    }

    getNotificationsToken = async () => {
      try {
        const token = '' // await firebase.messaging().getToken()

        this.props.upsertDevice({ variables: {
          token,
          information: {
            os: Platform.OS,
            osVersion: Platform.Version,
            model: DeviceInfo.getModel(),
            appVersion: DeviceInfo.getVersion()
          }
        }})
      } catch (error) {
        throw error
      }
    }

    onNotification = notification => {

    }

    render () {
      return (
        <WrappedComponent
          getNotificationsToken={this.getNotificationsToken}
          {...this.props}
        />
      )
    }
  }
)

export default compose(
  setUrl,
  upsertDevice,
  rollDeviceToken,
  pustNotificationsWrapper
)
