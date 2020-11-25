import { AppRegistry } from 'react-native'
import App from './src/App'
import TrackPlayer from 'react-native-track-player'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)

// TrackPlayer.registerEventHandler should be registered right after registering your React application with AppRegistry:

// TrackPlayer.registerPlaybackService(() =>
//   require('./src/components/AudioPlayer/audioservice.js'),
// )

// TrackPlayer.registerEventHandler(async (event) => {
//   switch (event.type) {
//     case 'remote-play':
//       return TrackPlayer.play()
//     case 'remote-pause':
//       return TrackPlayer.pause()
//     case 'remote-stop':
//       return client.mutate({
//         variables: { url: null },
//         mutation: setAudioMutation,
//       })
//     case 'playback-state':
//       return client.mutate({
//         variables: { state: event.state },
//         mutation: setPlaybackStateMutation,
//       })
//   }
// })
