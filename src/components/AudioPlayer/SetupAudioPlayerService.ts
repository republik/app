import TrackPlayer, { AppKilledPlaybackBehavior, Capability, RepeatMode } from 'react-native-track-player'

/**
 * Setup the AudioPlayer with all the necessary configuration.
 * @returns boolean saying if the AudioPlayer is ready to be used
 */
const SetupAudioPlayerService = async () => {
  let isSetup = false
  try {
    await TrackPlayer.getCurrentTrack()
    isSetup = true
  } catch (err) {
    await TrackPlayer.setupPlayer({
      backBuffer: 30,
    })
    await TrackPlayer.updateOptions({
      forwardJumpInterval: 30,
      backwardJumpInterval: 10,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpForward,
        Capability.JumpBackward,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause
      ],
      android: {
         appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback
        },
    })
    await TrackPlayer.setRepeatMode(RepeatMode.Off)
    isSetup = true
  } finally {
    return isSetup
  }
}

export default SetupAudioPlayerService
