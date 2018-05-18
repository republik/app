import { PushNotificationIOS } from 'react-native';
import PushNotification from 'react-native-push-notification';

const configure = () => {
  PushNotification.configure({
    requestPermissions: true,
   onRegister: function(token) {},
   onNotification: function(notification) {
     notification.finish(PushNotificationIOS.FetchResult.NoData);
   },
 });
}

const localNotification = ({ message = '', seconds = 0 }) => {
  PushNotification.localNotificationSchedule({
    message: message,
    date: new Date(Date.now() + (seconds * 1000)),
  })
}

export default {
  configure,
  localNotification
};
