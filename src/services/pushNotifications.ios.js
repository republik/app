import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import NotificationsIOS from 'react-native-notifications'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened)
    }

    componentWillUnmount () {
      NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened)
    }

    onPushRegistered = (token) => {
      console.log('Device Token Received', token)

      this.props.upsertDevice({ variables: {
        token,
        information: {
          os: Platform.OS,
          osVersion: Platform.Version,
          model: DeviceInfo.getModel(),
          appVersion: DeviceInfo.getVersion()
        }
      }})
    }

    onNotificationOpened = (notification) => {
      const data = notification.getData()

      switch (data.type) {
        case 'discussion':
          return this.props.setUrl({ variables: { url: data.url } })
        case 'authorization':
          return navigator.navigate('Login', { url: data.url })
      }
    }

    getNotificationsToken = async () => {
      if (!DeviceInfo.isEmulator()) {
        NotificationsIOS.requestPermissions()
      }
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
