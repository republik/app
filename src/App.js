import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { isEmulator } from 'react-native-device-info'
import SplashScreen from 'react-native-splash-screen'

import Web from './screens/Web'

const App = () => {
  useEffect(() => {
    isEmulator().then((isEmulator) => {
      console.log(isEmulator)
      if (!isEmulator) {
        Notifications.registerRemoteNotifications()
        Notifications.events().registerRemoteNotificationsRegistered(
          (event) => {
            // TODO: Send the token to my server so it could send back push notifications...
            console.log('Device Token Received', event.deviceToken)
          },
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
            completion()
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

  return (
    <>
      <StatusBar />
      <Web />
    </>
  )
}

export default App
