import React from 'react'
import { TouchableOpacity, StyleSheet, Text } from 'react-native'
import Popover from './Popover'

const styles = StyleSheet.create({
  container: {
    height: 45,
    zIndex: 300,
    width: '100%',
    borderBottomWidth: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomColor: 'rgb(218, 221, 220)'
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 16
  }
})

const Subheader = ({ active }) => (
  <Popover style={styles.container} active={active}>
    <TouchableOpacity style={styles.item}>
      <Text style={styles.text}>Front</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.item}>
      <Text style={styles.text}>Feed</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.item}>
      <Text style={styles.text}>Rubriken</Text>
    </TouchableOpacity>
  </Popover>
)

export default Subheader
