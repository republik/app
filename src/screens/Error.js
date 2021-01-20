import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useColorContext } from '../utils/colors'

const ErrorView = ({ onReload }) => {
  const { colors } = useColorContext()

  return (
    <View style={[styles.container, { backgroundColor: colors.default }]}>
      <View style={styles.logo}>
        <Image source={require('../assets/images/republik_logo.png')} />
      </View>
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Nicht verfügbar
        </Text>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Bitte prüfen Sie Ihre Internetverbindung.
        </Text>
        <TouchableOpacity onPress={onReload}>
          <Text
            style={[
              styles.button,
              {
                backgroundColor: colors.default,
                borderColor: colors.text,
                color: colors.text,
              },
            ]}>
            neu laden
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ErrorView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  errorTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'GT America',
  },
  errorText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'GT America',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 20,
    borderWidth: 1,
  },
})
