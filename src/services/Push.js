import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import {
  isEmulator,
  getModel,
  getDeviceId,
  getBrand,
} from 'react-native-device-info'
import { Notifications } from 'react-native-notifications'

import { useGlobalState } from '../GlobalState'

const init = async ({ isSignedIn, setGlobalState, dispatch }) => {
  if (!isSignedIn) {
    setGlobalState({ pushReady: true })
    return
  }

  const isInEmulator = await isEmulator()
  if (isInEmulator) {
    setGlobalState({ pushReady: true })
    return
  }

  const onNotificationOpened = (notification) => {
    const data = notification.getData()
    setGlobalState({ pendingUrl: data.url })
  }

  const initialNotification = await Notifications.getInitialNotification()
  if (initialNotification) {
    onNotificationOpened(initialNotification)
  }
  setGlobalState({ pushReady: true })

  Notifications.registerRemoteNotifications()
  Notifications.events().registerRemoteNotificationsRegistered((event) => {
    dispatch({
      type: 'postMessage',
      content: {
        type: 'onPushRegistered',
        data: {
          token: event.deviceToken,
          os: Platform.OS,
          osVersion: Platform.Version,
          brand: getBrand(),
          model: getModel(),
          deviceId: getDeviceId(),
        },
      },
    })
  })
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
      console.warn('Notification Received - Background', notification.payload)
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

const PushService = () => {
  const {
    persistedState: { isSignedIn },
    setGlobalState,
    dispatch,
  } = useGlobalState()

  useEffect(() => {
    init({
      isSignedIn,
      setGlobalState,
      dispatch,
    })
  }, [isSignedIn, dispatch, setGlobalState])

  return null
}

export default PushService
