import React, { Component } from 'react'
import { compose } from 'react-apollo'
import { withMe } from '../apollo'

import pushNotificationProvider from './pushNotificationsProvider'

const pustNotificationsWrapper = WrappedComponent => (
  class extends Component {
    componentWillReceiveProps (nextProps) {
      if (nextProps.me && nextProps.me !== this.props.me) {
        this.props.initNotifications()
      }
    }

    render () {
      const { initNotifications, ...props} = this.props
      return (
        <WrappedComponent {...props} />
      )
    }
  }
)

export default compose(
  pushNotificationProvider,
  withMe,
  pustNotificationsWrapper
)
