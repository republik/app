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
import { APP_VERSION, USER_AGENT } from '../constants'
const init = async ({ isSignedIn, setGlobalState, dispatch }) => {
  if (!isSignedIn) {
    setGlobalState({ pushReady: true })
    return
  }

  // Todo: remove this commented section when releasing
  // const isInEmulator = await isEmulator()
  // if (isInEmulator) {
  //   setGlobalState({ pushReady: true })
  //   return
  // }

  const onNotificationOpened = (notification) => {
    const data = notification.payload.data
    if (data?.type === 'authorization') {
      // authorization only doesn't trigger navigation
      // webview listens to appstate and triggers login overlay
      return
    }
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
          appVersion: APP_VERSION,
          userAgent: USER_AGENT,
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
      const data = notification.payload.data
      if (data?.type === 'authorization') {
        // authorization only triggers a notification if the app is in
        // background.
        return
      }
      completion({ alert: true, sound: true, badge: true })
    },
  )
  Notifications.events().registerNotificationOpened(
    (notification, completion) => {
      onNotificationOpened(notification)
      completion()
    },
  )
  Notifications.events().registerNotificationReceivedBackground(
    (notification, completion) => {
      console.log('Notification Received - Background', notification.payload)
      completion({ alert: true, sound: true, badge: false })
    },
  )
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
