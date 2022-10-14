import { AudioQueueItem } from './types/AudioQueueItem';
import { AudioEvent } from './AudioEvent';
import { useCallback, useRef, useState } from "react"
import TrackPlayer, { Event, State, Track, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import Logo from '../../assets/images/playlist-logo.png'
import useWebViewEvent from '../../lib/useWebViewEvent';
import useInterval from '../../lib/useInterval';
import useWebViewHandlers from './hooks/useWebViewHandlers';
import useCurrentTrack from './hooks/useCurrentTrack';

type Test = {
    item: AudioQueueItem
    track: Track | null
}

async function getCurrentPlayingTrack() {
    const currentTrackIndex = await TrackPlayer.getCurrentTrack()
    if (currentTrackIndex == null) {
      return null
    }
    return await TrackPlayer.getTrack(currentTrackIndex)
  }

// Interval in ms to sync track-player state with web-ui.
const SYNC_INTERVAL_WHILE_PLAYING = 500
const SYNC_INTERVAL_WHILE_CONNECTING = 1000

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
    const playerState = usePlaybackState()
    const [trackedQueue, setTrackedQueue] = useState<AudioQueueItem[]>([])
    const currentTrackIndex = useCurrentTrack()
    const currentTrackRef = useRef<number | null>(null);

    const [activeTrack, setActiveTrack] = useState<Test | null>(null)
    const delayTrack = useRef<Test | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    const resetCurrentTrack = async () => {
        delayTrack.current = null
        setActiveTrack(null)
        await TrackPlayer.reset()
    }

    /**
     * The active state decides wheter the player has initialized the queue or not.
     */
    const [isQueueInitialized, setIsQueueInitialized] = useState(false)

    const { notifyStateSync, notifyQueueAdvance, notifyError } = useWebViewHandlers()

    const handleError = (error: Error) => {
        console.error(error)
        notifyError(error)
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

            notifyStateSync({
                itemId: track?.itemId,
                playerState: state,
                duration,
                position,
                playbackRate: Math.round(playbackRate * 100) / 100,
            })
            
        }, [notifyStateSync])

    /**
     * Inform web-view to advance audio-queue.
     */
    const handleQueueAdvance = useCallback(async (itemId: string) => {
        notifyQueueAdvance(itemId)
        syncStateWithWebUI()
    }, [syncStateWithWebUI, notifyQueueAdvance])

    const getInitialTime = (track: Track, initialTime?: number) => {
        const out =  initialTime ?? track?.initialTime ?? 0
        console.log('xxx - resolved initialTime', out, {
            initialTime,
            track: track?.initialTime
        })
        return out
    }

    /**
     * Handle play event. If the queue was not initialized yet, initialize it.
     * After the initialization, the track will seek its initialTime if given.
     * @param initialTime to seek to when playing
     */
    const handlePlay = useCallback(async (initialTime?: number) => {
        try {
            /*
            // Initialize the queue lazily once the first time the player is started.
            if (!isQueueInitialized) {
                if (trackedQueue && trackedQueue) {
                    await handleQueueUpdate(trackedQueue)
                }
                setIsQueueInitialized(true)
                */
            if (!isInitialized) {
                setIsInitialized(true)
                if (
                    delayTrack?.current 
                    && delayTrack.current !== null 
                    && delayTrack.current.track !== null
                ) {
                    console.log('xxx delayTrack', delayTrack.current)
                    setActiveTrack(delayTrack.current)
                    await TrackPlayer.add(delayTrack.current.track)
                    console.log('test -- initialize on first play')
                    // Seek the intialTime for the first item in the queue.
                    // For all subsequent items, the initialTime is seeked in the PlaybackTrackChangedEvent handler.
                    const firstTrack = delayTrack.current?.track
                    initialTime = getInitialTime(firstTrack, initialTime)
                }
            }
            const queue = await TrackPlayer.getQueue()
            console.log('test -- play', queue)

            if (initialTime) {
                console.log('xxx -- play skipTo', initialTime)
                // 
                await TrackPlayer.skip(0, initialTime)
            }

            await TrackPlayer.play()
            if (initialTime !== undefined && initialTime > 0) {
                setTimeout(() => {
                    TrackPlayer.seekTo(initialTime)
                }, 500)
            }
            syncStateWithWebUI()
            return
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI, isInitialized])

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
            console.log('xxx - resetting track player')
            setIsQueueInitialized(false)
            setIsInitialized(false)
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

    const handleSkipToNext = useCallback(async () => {
        try {
            await TrackPlayer.skipToNext()
            // After skipToNext, the web-ui will receive a handleQueueAdvance event.
            // Sent by the useEffect that handles the currentTrack changes.
            syncStateWithWebUI()
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI])

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
            /**
             * Remove everything but the current track from the queue,
             * and replace it with the new received items.
             */

            /**
             * If the current track has to be updated, teardown the queue and add the entire queue again.
             * The currentTrackRef must also be reset to 'undefined'.
             */
            if (
                !!inputCurrentTrack &&
                (
                    currentTrack === null ||
                    mustUpdateCurrentTrack
                )
            ) {
                console.log('index update all')
                await TrackPlayer.reset()
                const nextItem: Track[] = payload
                    .map(getTrackFromAudioQueueItem)
                    .filter(Boolean) as Track[]
                await TrackPlayer.add(nextItem)
                currentTrackRef.current = null
            } else {
                console.log('index update tail')
                await TrackPlayer.removeUpcomingTracks()
                const nextItem: Track[] = inputQueuedTracks
                    .map(getTrackFromAudioQueueItem)
                    .filter(Boolean) as Track[]

                await TrackPlayer.add(
                    nextItem
                )
             }

            syncStateWithWebUI()

            /**
             * In case the audio-player was playing while receiving this update,
             * and the current track was changed, call handlePlay.
             */
            // in case the first track was changed and the state was playing,
            if (mustUpdateCurrentTrack && playerState === State.Playing) {
                await handlePlay()
            }
            syncStateWithWebUI()
            return Promise.resolve()
        } catch (error) {
            handleError(error)
            return Promise.reject(error)
        }
    } , [syncStateWithWebUI])

    useTrackPlayerEvents([
        Event.RemoteNext,
        Event.PlaybackQueueEnded,
    ], async (event) => {
        switch (event.type) {
            /**
             * Call advance queue when the current track has ended.
             * To remove it from the queue
             */
            case Event.PlaybackQueueEnded:
                console.log('xxx -ended')
                if (activeTrack === null || activeTrack.item?.id === undefined) {
                    alert('no active track queue ended')
                    console.log('active track', {
                        activeTrack, delyTrack: delayTrack.current
                    })
                    return
                }
                await handleQueueAdvance(activeTrack?.item.id)
                await resetCurrentTrack()
                //await handleQueueAdvance()
                break
            case Event.RemoteNext:
                if (activeTrack === null || activeTrack.item.id !== undefined) {
                    alert('no active track remote next')
                    return
                }
                await handleQueueAdvance(activeTrack?.item.id)
                break
            default:
                break
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
        ? SYNC_INTERVAL_WHILE_PLAYING
        : [State.Connecting].includes(playerState)
        ? SYNC_INTERVAL_WHILE_CONNECTING
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
    
    type AudioSetupData = {
        item : AudioQueueItem
        autoPlay?: boolean
        initialTime?: number
    }

    useWebViewEvent<AudioSetupData>('audio:setup', async ({item, autoPlay, initialTime}: AudioSetupData) => {
        try {
            console.log('test setup for item', item)
            const nextItem = {
                item,
                track: getTrackFromAudioQueueItem(item),
            }
            if (!nextItem.track) {
                console.log('test - no track found')
                return
            }

            if (!isInitialized) {
                console.log('test - not initialized, add to delay')
                delayTrack.current = nextItem
                return
            }
            console.log('test - initialized, add as first item')
            setActiveTrack(nextItem)
            console.log('xxx - setup', nextItem)
            await TrackPlayer.reset()
            await TrackPlayer.add(nextItem.track)

            const computedInitialTime = getInitialTime(nextItem.track, initialTime)

            syncStateWithWebUI()
            if (autoPlay) {
                console.log('test - auto play with start time', computedInitialTime)
                await handlePlay(computedInitialTime)
            } else {
                await TrackPlayer.skip(0, computedInitialTime)
            }
            return Promise.resolve()
        } catch (error) {
            handleError(error)
        }
        
    })
    /**
    useWebViewEvent<number>(AudioEvent.SKIP_TO_NEXT, handleSkipToNext)
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
    

    // TODO: add useEffect which syncs currenTrackIndex with the currentTrackRef.
    // When ever the currentTrackIndex is larger than the currentTrackRef we want to call onQueueAdvance
    // If the new index is not null and smaller than the last current index
    // onQueueAdvance should not be called. 
    // The index being lower is an indicator, that the queue has been reset and the new queue-head is now playing (should have index 0).
    // After all of that, the currentTrackRef should be updated.
    useEffect(() => {
        console.log('currentTrackIndex changed', {
            shouldAdvance: currentTrackIndex !== null && currentTrackRef?.current !== null && currentTrackIndex > currentTrackRef.current,
            currentTrackIndex,
            currentTrackRef: currentTrackRef?.current,
            queueHasReset: 
            currentTrackIndex === null ||
            (currentTrackRef?.current !== null && currentTrackIndex < currentTrackRef.current),
        })
        if (
            currentTrackRef?.current !== null 
            && currentTrackIndex !== null 
            && currentTrackIndex > currentTrackRef.current
        ) {
            handleQueueAdvance()
        }
        currentTrackRef.current = currentTrackIndex
        syncStateWithWebUI()
    }, [handleQueueAdvance, currentTrackIndex])
    */
    return null;
}

export default HeadlessAudioPlayer;
