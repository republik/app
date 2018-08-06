import RNFetchBlob from 'rn-fetch-blob'

const downloadUpdate = (baseUrl) => {
  if (!baseUrl) {
    console.warn('ota-simple missing baseUrl. cannot update.')
    return
  }
  console.log(`ota-simple downloadUpdate baseUrl: ${baseUrl}`)
  RNFetchBlob
    .config({
      path: `${RNFetchBlob.fs.dirs.DocumentDir}/latest.jsbundle`
    })
    .fetch('GET', `${baseUrl}/ios.jsbundle`, {})
    .then((res) => {
      console.log('ota-simple: downloaded new bundle to: ', res.path())
    })
}

export default {
  downloadUpdate
}
