import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useColorContext } from '../utils/colors'

const Loader = ({ loading }) => {
  const colorScheme = useColorContext()
  return (
    <View style={[styles.container, { backgroundColor: colorScheme.default }]}>
      <ActivityIndicator
        animating={loading}
        color={colorScheme.textSoft}
        size="large"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default Loader
