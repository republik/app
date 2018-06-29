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

    getNotificationsToken = async () => {
      try {
        await firebase.messaging().requestPermission()
        return firebase.messaging().getToken()
      } catch (error) {
        throw error
      }
    }

    onNotification = notification => {
      console.warn('onNotification', notification)
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

export default pustNotificationsWrapper
