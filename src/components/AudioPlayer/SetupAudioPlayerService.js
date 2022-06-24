import TrackPlayer, { Capability, RepeatMode } from 'react-native-track-player'

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
      stopWithApp: true,
      jumpInterval: 15,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpForward,
        Capability.JumpBackward,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
    })
    await TrackPlayer.setRepeatMode(RepeatMode.Off)
    isSetup = true
  } finally {
    return isSetup
  }
}

export default SetupAudioPlayerService
