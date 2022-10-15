import { AudioQueueItem } from './types/AudioQueueItem';
import { AudioEvent } from './AudioEvent';
import { useCallback, useEffect, useRef, useState } from "react"
import TrackPlayer, { Event, State, Track, usePlaybackState, useTrackPlayerEvents } from "react-native-track-player"
import Logo from '../../assets/images/playlist-logo.png'
import useWebViewEvent from '../../lib/useWebViewEvent';
import useInterval from '../../lib/useInterval';
import useWebViewHandlers from './hooks/useWebViewHandlers';
import { AppState, AppStateStatus, Platform } from 'react-native';

type AudioObject = {
    item: AudioQueueItem
    track: Track | null
    initialTime?: number
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

/** 
 * Generate a track object from an AudioQueueItem.
 * In addition the track object, we also set the following custom properties:
 * - itemId: id of the audioqueueitem
 * - mediaId: audioSoruce.mediaId
 * - initialTime: initialTime at which we should start playing the track
*/
function getTrackFromAudioQueueItem(item: AudioQueueItem): Track | null {
    const { meta } = item.document
    const { title, audioSource, image } = meta ?? {}
    if (!audioSource) {
        return null
    }
    const track: Track = {
        mediaId: audioSource.mediaId,
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
    const appState = useRef<AppStateStatus>(AppState.currentState)
    const playerState = usePlaybackState()

    const [activeTrack, setActiveTrack] = useState<AudioObject | null>(null)
    const delayTrack = useRef<AudioObject | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)

    const { notifyStateSync, notifyQueueAdvance, notifyError } = useWebViewHandlers()

    const resetCurrentTrack = async () => {
        delayTrack.current = null
        setActiveTrack(null)
        await TrackPlayer.reset()
    }


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
                await TrackPlayer.skip(0, initialTime)
                syncStateWithWebUI()
            }
            await TrackPlayer.setRate(playbackRate)
            await TrackPlayer.play()
            // iOS has issues with the playback rate on the inital play.
            if (Platform.OS == 'ios') {
               setTimeout(() => {
                    TrackPlayer.setRate(playbackRate)
                }, 1)
                setTimeout(() => {
                    TrackPlayer.setRate(playbackRate)
                }, 500)
                setTimeout(() => {
                    TrackPlayer.setRate(playbackRate)
                }, 1000)
            }
            syncStateWithWebUI()
            return
        } catch (error) {
            handleError(error)
        }
    }, [syncStateWithWebUI, isInitialized, playbackRate])

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
            setPlaybackRate(payload)
            console.log('xxx - set playback rate', payload)
            await TrackPlayer.setRate(payload)
            syncStateWithWebUI()
        } catch (error) {
            handleError(error)
        }
    } , [syncStateWithWebUI])


    useTrackPlayerEvents([
        Event.PlaybackQueueEnded,
    ], async (event) => {
        switch (event.type) {
            /**
             * Call advance queue when the current track has ended.
             * To remove it from the queue
             */
            case Event.PlaybackQueueEnded:
                const [
                    queue,
                    position,
                    duration,
                ] = await Promise.all([
                    TrackPlayer.getQueue(),
                    TrackPlayer.getPosition(),
                    TrackPlayer.getDuration(),
                ])

                // On iOS the queueEnded event is fired when the track just started playing on iOS.
                // If the ended event is fired but the first item is the activeItem and
                // positon and current are 0, ignore the ended event.
                if (
                    queue.length > 0 
                    && queue[0].itemId === activeTrack?.item.id
                    && (duration <= 0|| position < duration)
                ) {
                    return
                }

                // Handle faulty event emission when nothing is tracked
                if (activeTrack === null || activeTrack.item?.id === undefined) {
                    console.log('faulty playback-ended update', {
                        activeTrack, delyTrack: delayTrack.current
                    })
                    return
                }

                await handleQueueAdvance(activeTrack?.item.id)
                await resetCurrentTrack()
                //await handleQueueAdvance()
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
        playbackRate?: number
    }

    useWebViewEvent<AudioSetupData>(AudioEvent.SETUP_TRACK, async ({item, autoPlay, initialTime, playbackRate }: AudioSetupData) => {
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

            if (playbackRate) {
                setPlaybackRate(playbackRate)
            }

            // During the initial setup, the player safes the track into a ref.
            // In addtion, the initial playbackrate can also be set.
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

    // Sync the player state with the webview when the app comes to the foreground
    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextAppState => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            syncStateWithWebUI()
          }
    
          appState.current = nextAppState;
        });
    
        return () => {
          subscription.remove();
        };
      }, []);

    return null;
}

export default HeadlessAudioPlayer;
