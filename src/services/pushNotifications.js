import React, { Component } from 'react'
import firebase from 'react-native-firebase'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      this.notificationListener = firebase.notifications().onNotification(this.onNotification)
    }

    componentWillUnmount () {
      this.notificationListener()
    }

    askForNotificationPermission = async () => {
      try {
        await firebase.messaging().requestPermission()
        return firebase.messaging().getToken()
      } catch (error) {
        console.warn(error.message)
      }
    }

    onNotification = notification => {
      console.warn('onNotification', notification)
    }

    render () {
      return (
        <WrappedComponent
          askForNotificationPermission={this.askForNotificationPermission}
          {...this.props}
        />
      )
    }
  }
)

export default pustNotificationsWrapper
