import TrackPlayer from 'react-native-track-player'

module.exports = async function () {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play())
  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause())
  TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy())
  TrackPlayer.addEventListener('remote-seek', (e) =>
    TrackPlayer.seekTo(e.position),
  )
  TrackPlayer.addEventListener('remote-jump-forward', async (e) => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(position + e.interval)
  })
  TrackPlayer.addEventListener('remote-jump-backward', async (e) => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(position + e.interval)
  })
}
