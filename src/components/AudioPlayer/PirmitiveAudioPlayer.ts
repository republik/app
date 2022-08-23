import { useEffect, useMemo } from "react"
import TrackPlayer, { Event, State, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import { useGlobalState } from "../../GlobalState"
import Logo from '../../assets/images/playlist-logo.png'
import WebViewEventEmitter from "../../lib/WebViewEventEmitter"

// Interval in ms to sync track-player state with web-ui.
const SYNC_AUDIO_STATE_INTERVAL = 500

const SUBSCRIBED_EVENTS = [
    Event.PlaybackState,
    Event.RemotePlay,
    Event.RemotePause,
    Event.RemoteStop,
    Event.RemoteSeek,
    Event.RemoteJumpForward,
    Event.RemoteJumpBackward,
]

const PrimitiveAudioPlayer = ({}) => {
    const { dispatch } = useGlobalState()
    const playerState = usePlaybackState()
    /**
     * Send all relevant state of the track-player to the web-ui.
     */
    const syncState = useMemo(() => async () => {
        const [
            state,
            duration,
            position,
            playRate,
        ] = await Promise.all([
            TrackPlayer.getState(),
            TrackPlayer.getDuration(),
            TrackPlayer.getPosition(),
            TrackPlayer.getRate(),
        ])

        dispatch({ 
            type: "postMessage", 
            content: {
                type: "audio:sync",
                payload: {
                    isPlaying: state === State.Playing,
                    isLoading: state === State.Buffering,
                    duration,
                    currentTime: position,
                    playRate,
                }
            } 
        })
    }, [dispatch])
    
    useEffect(() => {
        console.log("PrimitiveAudioPlayer: useEffect", playerState)
        const interval = setInterval(() => {
            console.log('syncing track-player state')
            syncState()
        }, SYNC_AUDIO_STATE_INTERVAL);
        return () => clearInterval(interval);
    }, [playerState, syncState])

    const handlePlay = useMemo(() => async (payload) => {
        console.log('payload', payload)
        const { audioSource } = payload;
        await TrackPlayer.add({
            id: audioSource.mediaId,
            url: audioSource.mp3,
            title: audioSource.title,
            artist: 'Republik',
            artwork: Logo,
          })
          await TrackPlayer.play()
          await syncState()
    }, [syncState])

    const handlePause = useMemo(() => async () => {
        await TrackPlayer.pause()
        await syncState()
    } , [syncState])

    const handleStop = useMemo(() => async () => {
        await TrackPlayer.stop()
        await syncState()
    }, [syncState])

    const handleSeek = useMemo(() => async (payload) => {
        console.log('seek to', payload)
        await TrackPlayer.seekTo(payload)
        await syncState()
    }, [syncState])

    // Handle events from track-player
    useTrackPlayerEvents(SUBSCRIBED_EVENTS, (event) => {
        console.log('events', event)
    })

    // Handle events from the web-ui.
    useEffect(() => {
        WebViewEventEmitter.addListener("audio:play", handlePlay)
        WebViewEventEmitter.addListener("audio:pause", handlePause)
        WebViewEventEmitter.addListener("audio:stop", handleStop)
        WebViewEventEmitter.addListener("audio:seek", handleSeek)
        return () => {
            WebViewEventEmitter.removeListener("audio:play", handlePlay)
            WebViewEventEmitter.removeListener("audio:pause", handlePause)
            WebViewEventEmitter.removeListener("audio:stop", handleStop)
            WebViewEventEmitter.removeListener("audio:seek", handleSeek)
        }
    }, [handlePlay, handlePause, handleStop])

    return null;
}

export default PrimitiveAudioPlayer;
