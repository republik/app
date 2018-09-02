import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import NotificationsIOS from 'react-native-notifications'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'
import { APP_VERSION, USER_AGENT } from '../constants'
import mkDebug from '../utils/debug'

const debug = mkDebug('PushNotificationsIOS')

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    constructor (props, ...args) {
      super(props, ...args)

      NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed)
      NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened)

      // iOS does not show remote notifications when app is in foreground
      // Because of this, we dispatch a new local notification on native code that when clicked,
      // react-native-notifications triggers this event. That's why we also bind it to `onNotificationOpened`
      NotificationsIOS.addEventListener('notificationReceivedForeground', this.onNotificationOpened)
    }

    componentWillUnmount () {
      NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered)
      NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed)
      NotificationsIOS.removeEventListener('notificationReceivedForeground', this.onNotificationOpened)
      NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened)
    }

    onPushRegistered = (token) => {
      debug('remoteNotificationsRegistered', token)
      this.props.upsertDevice({ variables: {
        token,
        information: {
          os: Platform.OS,
          osVersion: Platform.Version,
          model: DeviceInfo.getModel(),
          appVersion: APP_VERSION,
          userAgent: USER_AGENT
        }
      } })
    }

    onPushRegistrationFailed = (error) => {
      console.warn(error.localizedDescription, error)
    }

    onNotificationOpened = async (notification) => {
      const data = notification.getData()
      const { setUrl } = this.props

      debug('onNotificationOpened', data)
      switch (data.type) {
        case 'discussion':
          return setUrl({ variables: { url: data.url } })
        case 'authorization':
          return navigator.navigate('Login', { url: data.url })
      }
    }

    // called on launch if me is present or after sign in
    initNotifications = async () => {
      const isEmulator = DeviceInfo.isEmulator()
      debug('initNotifications', !isEmulator)
      if (!isEmulator) {
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
