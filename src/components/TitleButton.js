import React from 'react';
import { Image, TouchableOpacity } from 'react-native';

const icons = {
  profile: require('../assets/images/profile-icon.png'),
  hamburger: require('../assets/images/hamburger-icon.png'),
}

const TitleButton = ({ type, side, onPress }) => {
  const style = side === 'left'
    ? { marginLeft: 10 }
    : { marginRight: 10 };

  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <Image
        source={icons[type]}
        style={{ width: 25, height: 25 }}
      />
    </TouchableOpacity>
  );
};

export default TitleButton;
