import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform, AsyncStorage } from 'react-native'
import firebase from 'react-native-firebase'
import DeviceInfo from 'react-native-device-info'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'
import { APP_VERSION, USER_AGENT } from '../constants'

const TOKEN_KEY = 'notification_token'

const getInfo = () => ({
  os: Platform.OS,
  osVersion: Platform.Version,
  model: DeviceInfo.getModel(),
  appVersion: APP_VERSION,
  userAgent: USER_AGENT
})

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    constructor (props, ...args) {
      super(props, ...args)

      this.notificationListener = firebase.notifications().onNotification(this.onNotification)
      this.tokenRefreshListener = firebase.messaging().onTokenRefresh(this.onTokenRefresh)
      this.notificationOpenedListener = firebase.notifications().onNotificationOpened(this.onNotificationOpened)
      this.getInitialNotification = firebase.notifications().getInitialNotification(this.onNotificationOpened)
    }

    componentWillUnmount () {
      this.notificationListener()
      this.tokenRefreshListener()
      this.notificationOpenedListener()
    }

    createDefaultNotificationChannelForAndroid () {
      const channel = new firebase.notifications.Android.Channel(
        'notifications',
        'Notifications',
        firebase.notifications.Android.Importance.Max
      )
      firebase.notifications().android.createChannel(channel)
    }

    onNotificationOpened = ({ notification }) => {
      const data = notification.data || {}
      const { setUrl } = this.props

      switch (data.type) {
        case 'discussion':
          return setUrl({ variables: { url: data.url } })
        case 'authorization':
          return navigator.navigate('Login', { url: data.url })
      }
    }

    // called on launch if me is present or after sign in
    initNotifications = async () => {
      try {
        await firebase.messaging().requestPermission()
        const token = await firebase.messaging().getToken()

        await AsyncStorage.setItem(TOKEN_KEY, token)

        this.createDefaultNotificationChannelForAndroid()

        this.props.upsertDevice({ variables: {
          token,
          information: getInfo()
        } })
      } catch (error) {
        console.warn('initNotifications failed')
        console.warn(error)
      }
    }

    onTokenRefresh = async newToken => {
      await AsyncStorage.setItem(TOKEN_KEY, newToken)
      await this.props.upsertDevice({ variables: {
        token: newToken,
        information: getInfo()
      } })
    }

    onNotification = notification => {
      const data = notification.data || {}

      if (data.type === 'authorization') {
        return this.onNotificationOpened({ notification })
      }

      notification.android.setAutoCancel(true)
      notification.android.setChannelId('notifications')
      notification.android.setSmallIcon('notification_icon')
      notification.android.setPriority(firebase.notifications.Android.Priority.Max)

      firebase.notifications().displayNotification(notification)
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
