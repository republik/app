import CookieManager from 'react-native-cookies';
import { FRONTEND_URL } from '../constants';

const SESSION_COOKIE = 'connect.sid';

export const isUserLoggedIn = async () => {
  const cookie = await CookieManager.get(FRONTEND_URL);
  return cookie && cookie.hasOwnProperty(SESSION_COOKIE);
};
