import React from 'react'
import { View, StyleSheet } from 'react-native'
import Popover from './Popover'

const styles = StyleSheet.create({
  container: {
    height: 45,
    zIndex: 300,
    width: '100%',
    borderBottomWidth: 1,
    backgroundColor: '#FFF',
    borderBottomColor: 'rgb(218, 221, 220)'
  }
})

const Subheader = ({ active }) => (
  <Popover style={styles.container} active={active}>
    <View />
  </Popover>
)

export default Subheader
