import React, { useEffect } from 'react'
import { StatusBar, Platform } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { isEmulator, getModel } from 'react-native-device-info'
import SplashScreen from 'react-native-splash-screen'

import { APP_VERSION, USER_AGENT } from './constants'
import Web from './screens/Web'

//TOOD apollo
const upsertDevice = () => {}

const App = () => {
  useEffect(() => {
    isEmulator().then((isEmulator) => {
      if (!isEmulator) {
        Notifications.registerRemoteNotifications()
        Notifications.events().registerRemoteNotificationsRegistered((event) =>
          onPushRegistered(event),
        )
        Notifications.events().registerRemoteNotificationsRegistrationFailed(
          (event) => {
            console.warn(event)
          },
        )
        Notifications.events().registerNotificationReceivedForeground(
          (notification, completion) => {
            completion({ alert: true, sound: true, badge: true })
          },
        )
        Notifications.events().registerNotificationOpened(
          (notification, completion) => {
            console.warn(notification)
            onNotificationOpened(notification)
            completion()
          },
        )
        Notifications.events().registerNotificationReceivedBackground(
          (notification, completion) => {
            console.warn(
              'Notification Received - Background',
              notification.payload,
            )
            completion({ alert: true, sound: true, badge: false })
          },
        )
        setTimeout(() => {
          Notifications.postLocalNotification({
            body: 'Local notification!',
            title: 'Local Notification Title',
            sound: 'chime.aiff',
            silent: false,
            category: 'SOME_CATEGORY',
            userInfo: {},
          })
        }, 3000)
      }
    })
    SplashScreen.hide()
  }, [])

  const onPushRegistered = (event) => {
    upsertDevice({
      variables: {
        token: event.deviceToken,
        information: {
          os: Platform.OS,
          osVersion: Platform.Version,
          model: getModel(),
          appVersion: APP_VERSION,
          userAgent: USER_AGENT,
        },
      },
    })
  }

  const onNotificationOpened = async (notification) => {
    const data = notification.getData()

    switch (data.type) {
      case 'discussion':
        return //setUrl({ variables: { url: data.url } })
      case 'authorization':
        return // navigator.navigate('Login', { url: data.url })
    }
  }

  return (
    <>
      <StatusBar />
      <Web />
    </>
  )
}

export default App
