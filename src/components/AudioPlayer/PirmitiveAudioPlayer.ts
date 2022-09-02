import { AudioQueueItem } from './types/AudioQueueItem';
import { AudioEvent } from './AudioEvent';
import { useEffect, useMemo } from "react"
import TrackPlayer, { Event, State, Track, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import { useGlobalState } from "../../GlobalState"
import Logo from '../../assets/images/playlist-logo.png'
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

function getTrackFromAudioQueueItem(item: AudioQueueItem): Track | null {
    const { meta } = item.document
    const { title, audioSource, image } = meta ?? {}
    if (!audioSource) {
        return null
    }
    const track: Track = {
        id: audioSource.mediaId,
        audiQueueId: item.id,
        url: audioSource.mp3,
        title,
        artist: 'Republik',
        artwork: image ?? Logo,
        duration: audioSource.durationMs / 1000,
    }
    return track
}

const PrimitiveAudioPlayer = ({}) => {
    const { dispatch } = useGlobalState()
    const playerState = usePlaybackState()
    
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
                type: AudioEvent.SYNC,
                payload: {
                    isPlaying: state === State.Playing,
                    isLoading: state === State.Buffering || state === State.Connecting,
                    duration,
                    currentTime: position,
                    playRate: Math.round(playRate * 100) / 100,
                }
            } 
        })
    }, [dispatch])

    const handleQueueAdvance = useMemo(() => async () => {
        console.log('!!!!!! handleQueueAdvance !!!!!!!!')
        dispatch({ 
            type: "postMessage", 
            content: {
                type: AudioEvent.QUEUE_ADVANCE,
            } 
        })
    }, [dispatch])

    const handlePrepare = useMemo(() => async (payload) => {
        const { audioSource } = payload;
        const currentTrack = await getCurrentPlayingTrack();
        if (currentTrack === null || currentTrack?.id !== audioSource.mediaId) {
            console.log('resetting track player')
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
            const { audioSource } = payload;
            const currentTrack = await getCurrentPlayingTrack();

            // Load audio if not yet playing or if plying a different track
            if (currentTrack === null || currentTrack?.id !== audioSource.mediaId) {
                console.log('resetting track player')
                await TrackPlayer.reset()
                await TrackPlayer.add({
                    id: audioSource.mediaId,
                    url: audioSource.mp3,
                    title: audioSource.title,
                    artist: 'Republik',
                    artwork: Logo,
                })
            }

            const position = await TrackPlayer.getPosition()
            const duration = await TrackPlayer.getDuration()
            // If audio is has ended and play is executed again, seek to start.
            // restart from the beginning
            if (Math.floor(position) === Math.floor(duration)) {
                await TrackPlayer.seekTo(0)
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

    const handleResume = useMemo(() => async () => {
        console.log('!!!!!!!!!! resuming !!!!!!!!!')
        try {
            await TrackPlayer.play()
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    const handleStop = useMemo(() => async () => {
        try {
            console.log('resetting track player')
            await TrackPlayer.reset()
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    const handleSeek = useMemo(() => async (payload) => {
        try {
            await TrackPlayer.seekTo(payload)
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    const handleForward = useMemo(() => async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate?
            await handleSeek(position + payload)
        } catch (error) {
            console.error(error)
        }
    }, [handleSeek])

    const handleBackward = useMemo(() => async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate?
            await handleSeek(position - payload)
        } catch (error) {
            console.error(error)
        }
    } , [handleSeek])

    const handlePlaybackRate = useMemo(() => async (payload: number) => {
        try {
            await TrackPlayer.setRate(payload)
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    /**
     * Handle the queue being updated.
     */
    const handleQueueUpdate = useMemo(() => async (payload: AudioQueueItem[]) => {
        try {
            const [inputItem, ...inputQueuedTracks] = payload

            if (inputItem === null) {
                await TrackPlayer.reset()
                return
            }

            const inputCurrentTrack = getTrackFromAudioQueueItem(inputItem)
            const currentTrack = await getCurrentPlayingTrack()

            if (
                !!inputCurrentTrack &&
                (
                    currentTrack === null ||
                    currentTrack?.id !== inputCurrentTrack.id
                )
            ) {
                console.log('resetting track player')
                await TrackPlayer.reset()
                await TrackPlayer.add(inputCurrentTrack)
            }

            if (true) {
                await TrackPlayer.removeUpcomingTracks()
                inputQueuedTracks.forEach(async (item) => {
                    const track = getTrackFromAudioQueueItem(item)
                    // TODO: handle null track
                    if (track) {
                        await TrackPlayer.add(track) 
                    }
                })
            }
            await syncStateWithWebUI()
            console.log("queue", JSON.stringify({
                current: await TrackPlayer.getCurrentTrack(),
                queue: await TrackPlayer.getQueue(),
            }, null, 2))
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    useTrackPlayerEvents([
        Event.PlaybackTrackChanged,
        Event.PlaybackState,
        Event.PlaybackQueueEnded
    ], async (event) => {
        console.log('trackplayer event', event.type)
        switch (event.type) {
            case Event.PlaybackQueueEnded:
                await handleQueueAdvance()
                break
            case Event.PlaybackTrackChanged:
                const queue = await TrackPlayer.getQueue()
                if (event.nextTrack) {
                    await handleQueueAdvance()
                }
                break;
            case Event.PlaybackState:
                if (State.Paused === event.state) {
                    await handlePause()
                }
                if (State.Ready === event.state) {
                    await syncStateWithWebUI()
                }

                    
                break;
                default:
                    alert('unknown event')
                    break;
        }
    });

    useEffect(() => {
        if (
            playerState === State.None || 
            playerState === State.Stopped ||
            playerState === State.Paused ||
            playerState === State.Ready
        ) {
            return
        }
        const interval = setInterval(() => {
            syncStateWithWebUI()
        }, SYNC_AUDIO_STATE_INTERVAL)
        return () => clearInterval(interval);
    }, [playerState, syncStateWithWebUI])

    // Handle events from web-ui
    useWebViewEvent(AudioEvent.PLAY, handlePlay)
    useWebViewEvent(AudioEvent.PAUSE, handlePause)
    useWebViewEvent(AudioEvent.RESUME, handleResume)
    useWebViewEvent(AudioEvent.STOP, handleStop)
    useWebViewEvent(AudioEvent.SEEK, handleSeek)
    useWebViewEvent<number>(AudioEvent.FORWARD, handleForward)
    useWebViewEvent<number>(AudioEvent.BACKWARD, handleBackward)
    useWebViewEvent<number>(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
    useWebViewEvent(AudioEvent.PREPARE, handlePrepare)
    useWebViewEvent<AudioQueueItem[]>(AudioEvent.QUEUE_UPDATE, handleQueueUpdate)

    return null;
}

export default PrimitiveAudioPlayer;
