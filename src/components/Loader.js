import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useColorContext } from '../utils/colors'

const Loader = ({ loading }) => {
  const { colors } = useColorContext()
  return (
    <View style={[styles.container, { backgroundColor: colors.default }]}>
      <ActivityIndicator
        animating={loading}
        color={colors.textSoft}
        size="large"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default Loader
