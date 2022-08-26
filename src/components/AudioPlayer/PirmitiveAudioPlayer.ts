import { AudioEvent } from './AudioEvent';
import { useEffect, useMemo, useState } from "react"
import TrackPlayer, { Event, State, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import { useGlobalState } from "../../GlobalState"
import Logo from '../../assets/images/playlist-logo.png'
import WebViewEventEmitter from "../../lib/WebViewEventEmitter"

async function getCurrentPlayingTrack() {
    const currentTrackIndex = await TrackPlayer.getCurrentTrack()
    if (currentTrackIndex == null) {
      return null
    }
    return await TrackPlayer.getTrack(currentTrackIndex)
  }

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
    const [isLoading, setIsLoading] = useState(false)
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
                    isLoading: state === State.Buffering || state === State.Connecting,
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
        try {
            console.log('payload', payload)
            const { audioSource } = payload;
            const currentTrack = await getCurrentPlayingTrack();

            // Load audio if not yet playing or if plying a different track
            if (currentTrack === null || currentTrack?.id !== audioSource.mediaId) {
                await TrackPlayer.reset()
                await TrackPlayer.add({
                    id: audioSource.mediaId,
                    url: audioSource.mp3,
                    title: audioSource.title,
                    artist: 'Republik',
                    artwork: Logo,
                })
            }
            await TrackPlayer.play()
            await syncState()
        } catch (error) {
            console.error(error)
        }
    }, [syncState])

    const handlePause = useMemo(() => async () => {
        try {
            await TrackPlayer.pause()
            await syncState()
        } catch (error) {
            console.error(error)
        }
    } , [syncState])

    const handleStop = useMemo(() => async () => {
        try {
            await TrackPlayer.reset()
            await syncState()
        } catch (error) {
            console.error(error)
        }
    }, [syncState])

    const handleSeek = useMemo(() => async (payload) => {
        try {
            console.log('seek to', payload)
            await TrackPlayer.seekTo(payload)
            await syncState()
        } catch (error) {
            console.error(error)
        }
    }, [syncState])

    const handleForward = useMemo(() => async () => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate
            await handleSeek(position + 30)
        } catch (error) {
            console.error(error)
        }
    }, [handleSeek])

    const handleBackward = useMemo(() => async () => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate
            await handleSeek(position + 30)
        } catch (error) {
            console.error(error)
        }
    } , [handleSeek])

    const handlePlaybackRate = useMemo(() => async (payload) => {
        try {
            await TrackPlayer.setRate(payload)
            await syncState()
        } catch (error) {
            console.error(error)
        }
    } , [syncState])

    // Handle events from track-player
    useTrackPlayerEvents(SUBSCRIBED_EVENTS, (event) => {
        console.log('events', event)
    })

    // Handle events from the web-ui.
    useEffect(() => {
        WebViewEventEmitter.addListener(AudioEvent.PLAY, handlePlay)
        WebViewEventEmitter.addListener(AudioEvent.PAUSE, handlePause)
        WebViewEventEmitter.addListener(AudioEvent.STOP, handleStop)
        WebViewEventEmitter.addListener(AudioEvent.SEEK, handleSeek)
        WebViewEventEmitter.addListener(AudioEvent.FORWARD, handleForward)
        WebViewEventEmitter.addListener(AudioEvent.BACKWARD, handleBackward)
        WebViewEventEmitter.addListener(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
        return () => {
            WebViewEventEmitter.removeListener(AudioEvent.PLAY, handlePlay)
            WebViewEventEmitter.removeListener(AudioEvent.PAUSE, handlePause)
            WebViewEventEmitter.removeListener(AudioEvent.STOP, handleStop)
            WebViewEventEmitter.removeListener(AudioEvent.SEEK, handleSeek)
            WebViewEventEmitter.removeListener(AudioEvent.FORWARD, handleForward)
            WebViewEventEmitter.removeListener(AudioEvent.BACKWARD, handleBackward)
            WebViewEventEmitter.removeListener(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
        }
    }, [
        handlePlay,
        handlePause,
        handleStop,
        handleSeek,
        handleForward,
        handleBackward,
        handlePlaybackRate
    ])

    return null;
}

export default PrimitiveAudioPlayer;
