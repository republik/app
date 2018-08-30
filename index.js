import { AppRegistry } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import App from './src/App'
import { client, setPlaybackStateMutation } from './src/apollo'

AppRegistry.registerComponent('orbitingapp', () => App)

// TrackPlayer.registerEventHandler should be registered right after registering your React application with AppRegistry:
// https://github.com/react-native-kit/react-native-track-player/wiki/Documentation#registereventhandlerhandler
TrackPlayer.registerEventHandler(async event => {
  switch (event.type) {
    case 'remote-play':
      return TrackPlayer.play()
    case 'remote-pause':
      return TrackPlayer.pause()
    case 'remote-stop':
      return TrackPlayer.reset()
    case 'playback-state':
      return client.mutate({
        variables: { state: event.state },
        mutation: setPlaybackStateMutation
      })
  }
})
