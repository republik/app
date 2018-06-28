import React, { Component } from 'react'
import firebase from 'react-native-firebase'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification) => {
        console.log('>>>>')
        console.log(notification)
      })

      this.notificationListener = firebase.notifications().onNotification((notification) => {
        console.log('>>>>')
        console.log(notification)
      })

      this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
        console.log(notificationOpen)
      })
    }

    componentWillUnmount () {
      this.notificationDisplayedListener()
      this.notificationListener()
      this.notificationOpenedListener()
    }

    render () {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
)

export default pustNotificationsWrapper
