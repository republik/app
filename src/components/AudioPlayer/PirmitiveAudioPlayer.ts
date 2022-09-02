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

    /**
     * Inform web-view to advance audio-queue.
     */
    const handleQueueAdvance = useMemo(() => async () => {
        dispatch({ 
            type: "postMessage", 
            content: {
                type: AudioEvent.QUEUE_ADVANCE,
            } 
        })
        await syncStateWithWebUI()
    }, [dispatch, syncStateWithWebUI])

    /**
     * Play the track that is 
     */
    const handlePlay = useMemo(() => async () => {
        try {

            const queue = await TrackPlayer.getQueue()
            console.log('queue', queue)

            await TrackPlayer.play()
            await syncStateWithWebUI()
            return
            
            // TODO: find a solution to implement the below code-block with queued items
            /*
            const position = await TrackPlayer.getPosition()
            const duration = await TrackPlayer.getDuration()
            // If audio is has ended and play is executed again, seek to start.
            // restart from the beginning
            if (Math.floor(position) === Math.floor(duration)) {
                await TrackPlayer.seekTo(0)
            }

            await TrackPlayer.play()
            await syncStateWithWebUI()
            */
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

    /**
     * Called before the audio-player is visually hidden.
     */
    const handleStop = useMemo(() => async () => {
        try {
            console.log('resetting track player')
            await TrackPlayer.reset()
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    /**
     * Seek to a specific position in the audio-player.
     */
    const handleSeek = useMemo(() => async (payload) => {
        try {
            await TrackPlayer.seekTo(payload)
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    }, [syncStateWithWebUI])

    /**
     * Forward the given amount of seconds.
     */
    const handleForward = useMemo(() => async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate?
            await handleSeek(position + payload)
        } catch (error) {
            console.error(error)
        }
    }, [handleSeek])

    /**
     * Rewind the given amount of seconds.
     */
    const handleBackward = useMemo(() => async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate?
            await handleSeek(position - payload)
        } catch (error) {
            console.error(error)
        }
    } , [handleSeek])

    /**
     * Set the playback rate.
     */
    const handlePlaybackRate = useMemo(() => async (payload: number) => {
        try {
            await TrackPlayer.setRate(payload)
            await syncStateWithWebUI()
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    /**
     * Handle the received audio-queue items.
     */
    const handleQueueUpdate = useMemo(() => async (payload: AudioQueueItem[]) => {
        try {
            const [inputItem, ...inputQueuedTracks] = payload
            
            // If an empty queue was provided, reset the audio-player.
            if (!inputItem) {
                await TrackPlayer.reset()
                return
            }

            const inputCurrentTrack = getTrackFromAudioQueueItem(inputItem)
            const currentTrack = await getCurrentPlayingTrack()
            const playerState = await TrackPlayer.getState()
            const mustUpdateCurrentTrack = currentTrack?.id !== inputCurrentTrack?.id

            // In case the queue was emtpy before (meaning currentTrack would be null)
            // or if the first element in the received queue is different from the current track
            // reset the audio-player and add the first element to the queue
            if (
                !!inputCurrentTrack &&
                (
                    currentTrack === null ||
                    mustUpdateCurrentTrack
                )
            ) {
                console.log('resetting track player')
                
                await TrackPlayer.reset()
                await TrackPlayer.add(inputCurrentTrack)
            }

            /**
             * Remove the everything but the current track from the queue,
             * and replace it with the new received items.
             */
            if (true) { // TODO: check if queue is any different
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

            /**
             * In case the audio-player was playing while receiving this update,
             * and the current track was changed, call handlePlay.
             */
            // in case the first track was changed and the state was playing,
            if (mustUpdateCurrentTrack && playerState === State.Playing) {
                await handlePlay()
            }
        } catch (error) {
            console.error(error)
        }
    } , [syncStateWithWebUI])

    useTrackPlayerEvents([
        Event.PlaybackTrackChanged,
        Event.PlaybackState,
        Event.PlaybackQueueEnded
    ], async (event) => {
        switch (event.type) {
            /**
             * Call advance queue when the current track has ended.
             * To remove it from the queue
             */
            case Event.PlaybackQueueEnded:
                await handleQueueAdvance()
                break
            /**
             * If the current track has changed, and a nextTrack is given
             * remove the track from the queue.
             */
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
                if (State.Stopped === event.state) {
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
    useWebViewEvent<void>(AudioEvent.PLAY, handlePlay)
    useWebViewEvent<void>(AudioEvent.PAUSE, handlePause)
    useWebViewEvent<void>(AudioEvent.STOP, handleStop)
    useWebViewEvent<void>(AudioEvent.SEEK, handleSeek)
    useWebViewEvent<number>(AudioEvent.FORWARD, handleForward)
    useWebViewEvent<number>(AudioEvent.BACKWARD, handleBackward)
    useWebViewEvent<number>(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
    useWebViewEvent<AudioQueueItem[]>(AudioEvent.QUEUE_UPDATE, handleQueueUpdate)

    return null;
}

export default PrimitiveAudioPlayer;
