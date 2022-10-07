import TrackPlayer, { Event } from 'react-native-track-player'

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play())
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause())
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy())
  TrackPlayer.addEventListener(Event.RemoteSeek, e =>
    TrackPlayer.seekTo(e.position),
  )
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async e => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(position + e.interval)
  })
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async e => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(position - e.interval)
  })
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext())
}
