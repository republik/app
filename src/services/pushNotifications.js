import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { Platform, AsyncStorage } from 'react-native'
import firebase from 'react-native-firebase'
import DeviceInfo from 'react-native-device-info'
import { upsertDevice, rollDeviceToken } from '../apollo'

const TOKEN_KEY = 'notification_token'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      this.notificationListener = firebase.notifications().onNotification(this.onNotification)
      this.tokenRefreshListener = firebase.messaging().onTokenRefresh(this.onTokenRefresh)
      this.notificationOpenedListener = firebase.notifications().onNotificationOpened(this.onNotificationOpened)
    }

    componentWillUnmount () {
      this.notificationListener()
      this.tokenRefreshListener()
    }

    createDefaultNotificationChannelForAndroid () {
      const channel = new firebase.notifications.Android.Channel(
        'notifications',
        'Notifications',
        firebase.notifications.Android.Importance.Max
      )
      firebase.notifications().android.createChannel(channel)
    }

    onNotificationOpened = notification => {
      console.log(notification)
    }

    getNotificationsToken = async () => {
      try {
        await firebase.messaging().requestPermission()
        const token = await firebase.messaging().getToken()

        await AsyncStorage.setItem(TOKEN_KEY, token)

        this.createDefaultNotificationChannelForAndroid()

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

    onTokenRefresh = async newToken => {
      const oldToken = await AsyncStorage.getItem(TOKEN_KEY)
      this.props.rollDeviceToken({ variables: { newToken, oldToken } })
      await AsyncStorage.setItem(TOKEN_KEY, newToken)
    }

    onNotification = notification => {
      // Open notification in foreground
      if (Platform.OS === 'android') {
        notification._android._channelId = 'notifications'
        notification._android._smallIcon = { icon: 'notification_icon' }
      }

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
  upsertDevice,
  rollDeviceToken,
  pustNotificationsWrapper
)
