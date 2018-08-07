import React, { Component } from 'react'
import { Platform, AsyncStorage } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import { unzip } from 'react-native-zip-archive'
import { OTA_BASE_URL, APP_VERSION } from '../constants'

const UPDATE_THREASHOLD = 15 * 60 * 1000
const LAST_OTA_UPDATE_KEY = 'LAST_OTA_UPDATE'
const BUNDLE_VERSION_KEY = 'BUNDLE_VERSION_KEY'
const VERSIONS_URL = `${OTA_BASE_URL}/versions.json`
const BUNDLE_ZIP_PATH = `${RNFetchBlob.fs.dirs.DocumentDir}/ota.zip`

const SLOT_A_KEY = 'A'
const SLOT_B_KEY = 'B'
const getBundleDir = (slotKey) =>
  `${RNFetchBlob.fs.dirs.DocumentDir}/ota/${slotKey}/`
const getSlotFile = (slotKey) =>
  `${getBundleDir(slotKey)}active`

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

    shouldCheck = async () => {
      const now = Date.now()
      const lastUpdate = await AsyncStorage.getItem(LAST_OTA_UPDATE_KEY)

      return now - parseInt(lastUpdate) > UPDATE_THREASHOLD
    }

    shouldUpdateToBundle = async (bundleVersion) => {
      const localBundleVersion = await AsyncStorage.getItem(BUNDLE_VERSION_KEY)
      const localBundleDate = localBundleVersion && new Date(localBundleVersion)
      if (!localBundleDate) {
        return true
      }
      const removeBundleDate = new Date(bundleVersion)
      return removeBundleDate > localBundleDate
    }

    getCurrentlyFreeSlot = async () => {
      const a = await RNFetchBlob.fs.exists(getSlotFile(SLOT_A_KEY))
      return a ? SLOT_B_KEY : SLOT_A_KEY
    }

    activateSlot = async (slot) => {
      const free = slot === SLOT_A_KEY ? SLOT_B_KEY : SLOT_A_KEY
      await RNFetchBlob.fs.createFile(getSlotFile(slot), 'usethis', 'utf8')
        .catch((error) => {
          console.error('ota-simple: createFile error: ', error)
        })
      await RNFetchBlob.fs.unlink(getSlotFile(free))
        .catch((error) => {
          console.error('ota-simple: unlink error: ', error)
        })
    }

    downloadAndExtractBundle = async (bundleVersion) => {
      const url = `${OTA_BASE_URL}/${bundleVersion}/${Platform.OS}.zip`
      console.log(`ota-simple: downloading ${url} ...`)

      const res = await RNFetchBlob
        .config({ path: BUNDLE_ZIP_PATH })
        .fetch('GET', url, {})
      console.log('ota-simple: downloaded new bundle zip to: ', res.path())

      const freeSlot = await this.getCurrentlyFreeSlot()
      const bundleDir = getBundleDir(freeSlot)

      console.log(`ota-simple: unzipping to ${bundleDir} ...`)
      unzip(res.path(), bundleDir)
        .then(async (path) => {
          console.log(`ota-simple: unzip completed to ${path}`)
          // cleanup
          await this.activateSlot(freeSlot)
          RNFetchBlob.fs.unlink(BUNDLE_ZIP_PATH)
        })
        .catch((error) => {
          console.error('ota-simple: unzip error: ', error)
        })
    }

    checkForUpdates = async ({ force } = {}) => {
      const shouldCheck = await this.shouldCheck()
      if (!force && !shouldCheck) return

      // Save check date to disk
      await AsyncStorage.setItem(LAST_OTA_UPDATE_KEY, `${Date.now()}`)

      try {
        const versionsResult = await RNFetchBlob.fetch('GET', VERSIONS_URL, {})

        if (versionsResult && versionsResult.data) {
          const versions = JSON.parse(versionsResult.data)
          const remoteEntry = versions.find(v => v.bin === APP_VERSION)
          const shouldUpdateToBundle = await this.shouldUpdateToBundle(remoteEntry.bundle)

          if (remoteEntry && shouldUpdateToBundle) {
            this.downloadAndExtractBundle(remoteEntry.bundle)
            await AsyncStorage.setItem(BUNDLE_VERSION_KEY, remoteEntry.bundle)
          }
        }
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
