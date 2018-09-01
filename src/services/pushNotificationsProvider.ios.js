import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import NotificationsIOS from 'react-native-notifications'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'
import { APP_VERSION, USER_AGENT } from '../constants'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened)

      // iOS does not show remote notifications when app is in foreground
      // Because of this, we dispatch a new local notification on native code that when clicked,
      // react-native-notifications triggers this event. That's why we also bind it to `onNotificationOpened`
      NotificationsIOS.addEventListener('notificationReceivedForeground', this.onNotificationOpened)

      NotificationsIOS.checkPermissions().then(() => {
        NotificationsIOS.consumeBackgroundQueue()
      })
    }

    componentWillUnmount () {
      NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.removeEventListener('notificationReceivedForeground', this.onNotificationOpened)
      NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened)
    }

    onPushRegistered = (token) => {
      this.props.upsertDevice({ variables: {
        token,
        information: {
          os: Platform.OS,
          osVersion: Platform.Version,
          model: DeviceInfo.getModel(),
          appVersion: APP_VERSION,
          userAgent: USER_AGENT
        }
      }})
    }

    onNotificationOpened = async (notification) => {
      const data = notification.getData()
      const { setUrl } = this.props

      switch (data.type) {
        case 'discussion':
          return setUrl({ variables: { url: data.url } })
        case 'authorization':
          return navigator.navigate('Login', { url: data.url })
      }
    }

    initNotifications = async () => {
      if (!DeviceInfo.isEmulator()) {
        NotificationsIOS.requestPermissions()
        NotificationsIOS.consumeBackgroundQueue()
      }
    }

    render () {
      return (
        <WrappedComponent
          initNotifications={this.initNotifications}
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
