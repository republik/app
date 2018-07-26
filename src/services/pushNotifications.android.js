import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform, AsyncStorage } from 'react-native'
import firebase from 'react-native-firebase'
import DeviceInfo from 'react-native-device-info'
import navigator from './navigation'
import { setUrl, upsertDevice, rollDeviceToken } from '../apollo'
import { APP_VERSION } from '../constants'

const TOKEN_KEY = 'notification_token'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
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

      switch (data.type) {
        case 'discussion':
          return this.props.setUrl({ variables: { url: data.url } })
        case 'authorization':
          return navigator.navigate('Login', { url: data.url })
      }
    }

    getNotificationsToken = async () => {
      try {
        await firebase.messaging().requestPermission()
        const token = await firebase.messaging().getToken()

        console.log('>>>>', token)

        await AsyncStorage.setItem(TOKEN_KEY, token)

        this.createDefaultNotificationChannelForAndroid()

        this.props.upsertDevice({ variables: {
          token,
          information: {
            os: Platform.OS,
            osVersion: Platform.Version,
            model: DeviceInfo.getModel(),
            appVersion: APP_VERSION
          }
        }})
      } catch (error) {
        throw error
      }
    }

    onTokenRefresh = async newToken => {
      const oldToken = await AsyncStorage.getItem(TOKEN_KEY)
      this.props.rollDeviceToken({ variables: { newToken, oldToken } })
      await AsyncStorage.setItem(TOKEN_KEY, newToken)
    }

    onNotification = notification => {
      notification.android.setAutoCancel(true)
      notification.android.setChannelId('notifications')
      notification.android.setSmallIcon('notification_icon')
      notification.android.setPriority(firebase.notifications.Android.Priority.Max)

      console.log(notification.android)

      firebase.notifications().displayNotification(notification)
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
