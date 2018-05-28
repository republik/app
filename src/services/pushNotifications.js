import { AppState, PushNotificationIOS } from 'react-native'
import PushNotification from 'react-native-push-notification'
import { lifecycle } from 'recompose'

const configure = () => {
  PushNotification.configure({
    requestPermissions: true,
    onRegister: (token) => {
      // Push token to server
    },
    onNotification: (notification) => {
      notification.finish(PushNotificationIOS.FetchResult.NoData)
    }
  })
}

const localNotification = ({ message = '', seconds = 0 }) => {
  PushNotification.localNotificationSchedule({
    message: message,
    date: new Date(Date.now() + (seconds * 1000))
  })
}

const handleAppStateChange = (appState) => {

}

function componentDidMount () {
  configure()

  AppState.addEventListener('change', handleAppStateChange)
}

function componentWillUnmount () {
  AppState.removeEventListener('change', handleAppStateChange)
}

export default lifecycle({ componentDidMount, componentWillUnmount })
