import { AudioQueueItem } from './types/AudioQueueItem';
import { AudioEvent } from './AudioEvent';
import { useCallback, useEffect, useState } from "react"
import TrackPlayer, { Event, PlaybackStateEvent, PlaybackTrackChangedEvent, State, Track, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import { useGlobalState } from "../../GlobalState"
import Logo from '../../assets/images/playlist-logo.png'
import useWebViewEvent from '../../lib/useWebViewEvent';
import useInterval from '../../lib/useInterval';

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
        itemId: item.id,
        url: audioSource.mp3,
        title,
        artist: 'Republik',
        artwork: image ?? Logo,
        duration: audioSource.durationMs / 1000,
        initialTime: audioSource?.userProgress?.secs || 0
    }
    return track
}

/**
 * HeadlessAudioPlayer is a wrapper around react-native-track-player without any react-native UI.
 * The player is controlled through events received from the webview.
 */
const HeadlessAudioPlayer = ({}) => {
    const { dispatch } = useGlobalState()
    const playerState = usePlaybackState()
    const [trackedQueue, setTrackedQueue] = useState<AudioQueueItem[]>([])
    /**
     * The active state decides wheter the player has initialized the queue or not.
     */
    const [isQueueInitialized, setIsQueueInitialized] = useState(false)

    const handleError = (error: Error) => {
        dispatch({
            type: "postMessage", 
            content: {
                type: AudioEvent.ERROR,
                payload: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            } 
        })
    }
    
    /**
     * Send all relevant state of the track-player to the web-ui.
     */
    const syncStateWithWebUI = useCallback(
            async () => {
            const [
                track,
                state,
                duration,
                position,
                playbackRate,
            ] = await Promise.all([
                getCurrentPlayingTrack(),
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
                        itemId: track?.itemId,
                        playerState: state,
                        duration,
                        currentTime: position,
                        playbackRate: Math.round(playbackRate * 100) / 100,
                    }
                } 
            })
        }, [dispatch])

    /**
     * Inform web-view to advance audio-queue.
     */
    const handleQueueAdvance = useCallback(async () => {
        dispatch({ 
            type: "postMessage", 
            content: {
                type: AudioEvent.QUEUE_ADVANCE,
            } 
        })
        syncStateWithWebUI()
    }, [dispatch, syncStateWithWebUI])

    /**
     * Handle play event. If the queue was not initialized yet, initialize it.
     * After the initialization, the track will seek its initialTime if given.
     * @param initialTime to seek to when playing
     */
    const handlePlay = useCallback(async (initialTime?: number) => {
        try {
            // Initialize the queue lazily once the first time the player is started.
            if (!isQueueInitialized) {
                if (trackedQueue && trackedQueue.length > 0) {
                    await handleQueueUpdate(trackedQueue)
                }
                setIsQueueInitialized(true)

                // Seek the intialTime for the first item in the queue.
                // For all subsequent items, the initialTime is seeked in the PlaybackTrackChangedEvent handler.
                const firstTrack = await getCurrentPlayingTrack()
                if (firstTrack?.initialTime) {
                    initialTime = firstTrack.initialTime
                }
            }

            if (initialTime) {
                await TrackPlayer.skip(0, initialTime)
            }

            await TrackPlayer.play()
            syncStateWithWebUI()
            return
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI, isQueueInitialized, trackedQueue])

    const handlePause = useCallback(async () => {
        try {
            await TrackPlayer.pause()
            syncStateWithWebUI()
        } catch (error) {
            handleError(error)
        }
    } , [syncStateWithWebUI, handleError])

    /**
     * Called before the audio-player is visually hidden.
     */
    const handleStop = useCallback(async () => {
        try {
            console.log('resetting track player')
            setIsQueueInitialized(false)
            await TrackPlayer.reset()
            syncStateWithWebUI()
            
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI])

    /**
     * Seek to a specific position in the audio-player.
     */
    const handleSeek = useCallback(async (payload) => {
        try {
            await TrackPlayer.seekTo(payload)
            syncStateWithWebUI()
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI])

    /**
     * Forward the given amount of seconds.
     */
    const handleForward = useCallback(async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            // TODO: adapt to playback rate?
            await handleSeek(position + payload)
        } catch (error) {
            handleError(error)
        }
    }, [handleSeek])

    /**
     * Rewind the given amount of seconds.
     */
    const handleBackward = useCallback(async (payload: number) => {
        try {
            const position = await TrackPlayer.getPosition()
            await handleSeek(position - payload)
        } catch (error) {
            handleError(error)
        }
    } , [handleSeek])

    /**
     * Set the playback rate.
     */
    const handlePlaybackRate = useCallback(async (payload: number) => {
        try {
            await TrackPlayer.setRate(payload)
            syncStateWithWebUI()
        } catch (error) {
            handleError(error)
        }
    } , [syncStateWithWebUI])

    /**
     * Handle the received audio-queue items.
     */
    const handleQueueUpdate = useCallback(async (payload: AudioQueueItem[]) => {
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
                console.log("QueueUpdate", "teardown head")
                await TrackPlayer.reset()
                await TrackPlayer.add(inputCurrentTrack)
                const { userProgress, durationMs } = inputItem.document.meta?.audioSource ?? {}
                const duration = inputCurrentTrack.duration || (durationMs ? durationMs / 1000 : undefined)
                
                // TODO: find out why sometimes seekTo is set, but current-time returns in first sync is 0 anyways.
                
                // Only load the userProgress if given and smaller within 2 seconds of the duration
                if (userProgress && (!duration || userProgress.secs + 2 < duration)) {
                    console.log("QueueUpdate", "seek to", userProgress.secs)
                    await TrackPlayer.seekTo(userProgress.secs)
                }
            }

            /**
             * Remove everything but the current track from the queue,
             * and replace it with the new received items.
             */
            console.log("QueueUpdate", "teardown tail")
            await TrackPlayer.removeUpcomingTracks()
            inputQueuedTracks.forEach(async (item) => {
                const track = getTrackFromAudioQueueItem(item)
                // TODO: handle null track
                if (track) {
                    await TrackPlayer.add(track) 
                }
            })
            
            syncStateWithWebUI()

            /**
             * In case the audio-player was playing while receiving this update,
             * and the current track was changed, call handlePlay.
             */
            // in case the first track was changed and the state was playing,
            if (mustUpdateCurrentTrack && playerState === State.Playing) {
                await handlePlay()
            }
            return Promise.resolve()
        } catch (error) {
            handleError(error)
            return Promise.reject(error)
        }
    } , [syncStateWithWebUI])

    useTrackPlayerEvents([
        Event.PlaybackTrackChanged,
        Event.PlaybackState,
        Event.RemoteNext,
        Event.PlaybackQueueEnded,
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
             * communicate the queue advance to the webview
             */
            case Event.PlaybackTrackChanged:
                const { nextTrack, ...rest } = (event as PlaybackTrackChangedEvent)
                console.log('PlaybackTrackChanged', nextTrack, rest)
                if (nextTrack && nextTrack !== 0) {
                    await handleQueueAdvance()
                    syncStateWithWebUI()
                }
                break;
            case Event.PlaybackState:
                const state = (event as PlaybackStateEvent).state
                if (State.Paused === state) {
                    await handlePause()
                }
                break;
            case Event.RemoteNext:
                await handleQueueAdvance()
                break
            default:
                console.error('unhandled track-player event')
                break;
        }
        syncStateWithWebUI()
    });

    // Sync the state with the webview if in a playing state
    useInterval(
        () => syncStateWithWebUI(),
        [
            State.Buffering,
            State.Playing,
        ].includes(playerState) 
        ? SYNC_AUDIO_STATE_INTERVAL 
        : null
    )

    // Handle events from web-ui
    useWebViewEvent<number|undefined>(AudioEvent.PLAY, handlePlay)
    useWebViewEvent<void>(AudioEvent.PAUSE, handlePause)
    useWebViewEvent<void>(AudioEvent.STOP, handleStop)
    useWebViewEvent<void>(AudioEvent.SEEK, handleSeek)
    useWebViewEvent<number>(AudioEvent.FORWARD, handleForward)
    useWebViewEvent<number>(AudioEvent.BACKWARD, handleBackward)
    useWebViewEvent<number>(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)
    useWebViewEvent<AudioQueueItem[]>(
        AudioEvent.QUEUE_UPDATE, 
        async (queue: AudioQueueItem[]) => {
            setTrackedQueue(queue)
            if (isQueueInitialized) {
                return handleQueueUpdate(queue)
            }
            return Promise.resolve()
        }
    )

    return null;
}

export default HeadlessAudioPlayer;
