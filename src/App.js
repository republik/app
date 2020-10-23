import React, { useEffect, useState } from 'react'
import { StatusBar, Platform, Linking } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { isEmulator, getModel } from 'react-native-device-info'
import SplashScreen from 'react-native-splash-screen'
import AsyncStorage from '@react-native-community/async-storage'

import { APP_VERSION, USER_AGENT } from './constants'
import Web from './screens/Web'
import { SIGN_IN_URL } from './constants'

//TOOD apollo
const upsertDevice = () => {}

const App = () => {
  const [webUrl, setWebUrl] = useState(SIGN_IN_URL)

  useEffect(() => {
    getWebViewURL()
    Linking.getInitialURL().then((url) => {
      if (url) handleOpenURL({ url })
    })
    Linking.addEventListener('url', handleOpenURL)

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
    return () => {
      Linking.removeEventListener('url', handleOpenURL)
    }
  }, [])

  const getWebViewURL = async () => {
    try {
      await AsyncStorage.clear()
      const value = await AsyncStorage.getItem('currentUrl')
      if (value !== null) {
        setWebUrl(value)
      }
    } catch (e) {
      // error reading value
    }
  }

  const handleOpenURL = async (e) => {
    try {
      setWebUrl(e.url)
    } catch (e) {
      console.warn(e)
    }
  }

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
    setWebUrl(data.url)
  }

  const onNavigationStateChange = async ({ url }) => {
    console.warn('onNavigationStateChange', url)
    try {
      await AsyncStorage.setItem('currentUrl', url)
    } catch (e) {
      console.warn(e)
    }
  }

  return (
    <>
      <StatusBar />
      <Web webUrl={webUrl} onNavigationStateChange={onNavigationStateChange} />
    </>
  )
}

export default App
