import { AudioEvent } from './AudioEvent';
import { useEffect, useMemo, useState } from "react"
import TrackPlayer, { Event, State, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import { useGlobalState } from "../../GlobalState"
import Logo from '../../assets/images/playlist-logo.png'
import WebViewEventEmitter from "../../lib/WebViewEventEmitter"
import useWebViewEvent from '../../lib/useWebViewEvent';

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
    const syncStateWithWebUI = useMemo(() => async () => {
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
            syncStateWithWebUI()
        }, playerState === State.Playing ? SYNC_AUDIO_STATE_INTERVAL : 2 * SYNC_AUDIO_STATE_INTERVAL);
        return () => clearInterval(interval);
    }, [playerState, syncStateWithWebUI])

    const handlePrepare = useMemo(() => async (payload) => {
        const { audioSource } = payload;
        const currentTrack = await getCurrentPlayingTrack();
        if (currentTrack === null || currentTrack?.id !== audioSource.mediaId) {
            await TrackPlayer.reset()
            await TrackPlayer.add({
                id: audioSource.mediaId,
                url: audioSource.mp3,
                title: audioSource.title,
                artist: 'Republik',
                artwork: Logo,
                duration: audioSource.durationMs / 1000,
            })
            TrackPlayer.updateMetadataForTrack
            await syncStateWithWebUI()
        }
    }, [syncStateWithWebUI])

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
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    const handlePause = useMemo(() => async () => {
        try {
            await TrackPlayer.pause()
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    const handleStop = useMemo(() => async () => {
        try {
            await TrackPlayer.reset()
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    const handleSeek = useMemo(() => async (payload) => {
        try {
            console.log('seek to', payload)
            await TrackPlayer.seekTo(payload)
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

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
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    // Handle events from track-player
    useTrackPlayerEvents(SUBSCRIBED_EVENTS, (event) => {
        console.log('events', event)
    })
    
    // Handle events from web-ui
    useWebViewEvent(AudioEvent.PLAY, handlePlay)
    useWebViewEvent(AudioEvent.PAUSE, handlePause)
    useWebViewEvent(AudioEvent.STOP, handleStop)
    useWebViewEvent(AudioEvent.SEEK, handleSeek)
    useWebViewEvent(AudioEvent.FORWARD, handleForward)
    useWebViewEvent(AudioEvent.BACKWARD, handleBackward)
    useWebViewEvent(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
    useWebViewEvent(AudioEvent.PREPARE, handlePrepare)

    return null;
}

export default PrimitiveAudioPlayer;
