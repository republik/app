import React, { Component } from 'react'
import { Platform, AsyncStorage, NativeModules } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import { OTA_BASE_URL } from '../constants'

// const NativeOTA = NativeModules.OTA

const UPDATE_THREASHOLD = 15 * 60 * 1000
const LAST_OTA_UPDATE_KEY = 'LAST_OTA_UPDATE'
const BUNDLE_PATH = `${RNFetchBlob.fs.dirs.DocumentDir}/latest.jsbundle`
const UPDATE_PATH = `${OTA_BASE_URL}/${Platform.OS}.jsbundle`

const cookiesWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount () {
      if (!OTA_BASE_URL) {
        console.warn('ota-simple missing baseUrl. cannot update.')
        return
      }

      // Force update everytime the app is started
      this.checkForUpdates({ force: true })
    }

    shouldUpdate = async () => {
      const now = Date.now()
      const lastUpdate = await AsyncStorage.getItem(LAST_OTA_UPDATE_KEY)

      return now - parseInt(lastUpdate) > UPDATE_THREASHOLD
    }

    checkForUpdates = async ({ force } = {}) => {
      const shouldUpdate = await this.shouldUpdate()
      if (!force && !shouldUpdate) return

      try {
        const res = await RNFetchBlob
          .config({ path: BUNDLE_PATH })
          .fetch('GET', UPDATE_PATH, {})

        // Save last update to disk
        await AsyncStorage.setItem(LAST_OTA_UPDATE_KEY, `${Date.now()}`)
        console.log('ota-simple: downloaded new bundle to: ', res.path())
      } catch (e) {
        console.warn(e.message)
      }
    }

    render () {
      return (
        <WrappedComponent {...this.props} checkForUpdates={this.checkForUpdates} />
      )
    }
  }
)

export default cookiesWrapper
