import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import NotificationsIOS from 'react-native-notifications'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    state = { notificationVisible: false }

    componentDidMount () {
      NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.addEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground)
      NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened)

      NotificationsIOS.checkPermissions().then(() => {
        NotificationsIOS.consumeBackgroundQueue()
      })
    }

    componentWillUnmount () {
      NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.removeEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground)
      NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened)
    }

    onNotificationReceivedForeground = (notification) => {
      const { notificationVisible } = this.state

      setTimeout(() => {
        this.setState({ notificationVisible: false })
      }, 7000)

      if (notificationVisible) {
        this.setState({ notificationVisible: false })
        return this.onNotificationOpened(notification)
      }

      this.setState({ notificationVisible: true })
    }

    onPushRegistered = (token) => {
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
        NotificationsIOS.consumeBackgroundQueue()
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
