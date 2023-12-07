import { AudioQueueItem } from './types/AudioQueueItem';
import { AudioEvent } from './AudioEvent';
import { useCallback, useEffect, useRef, useState } from "react"
import TrackPlayer, {
  Event,
  State,
  Track,
  usePlaybackState,
  useTrackPlayerEvents,
  PitchAlgorithm,
} from 'react-native-track-player';
import Logo from '../../assets/images/playlist-logo.png';
import useWebViewEvent from '../../lib/useWebViewEvent';
import useInterval from '../../lib/useInterval';
import useWebViewHandlers from './hooks/useWebViewHandlers';
import { AppState, AppStateStatus, BackHandler, Platform } from 'react-native';

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
// The queue ended event might not return a inconsistant position,
// To accomedate for that, we use a boundary to determine if the playback has ended.
// If duration is x-seconds and the position is x - PLAYBACK_ENDED_OFFSET seconds,
// we assume the playback has ended.
const PLAYBACK_ENDED_OFFSET = 3

/**
 * Generate a track object from an AudioQueueItem.
 * In addition the track object, we also set the following custom properties:
 * - itemId: id of the audioqueueitem
 * - mediaId: audioSoruce.mediaId
 * - initialTime: initialTime at which we should start playing the track
 */
function getTrackFromAudioQueueItem(
  item: AudioQueueItem,
  coverImage?: string,
): Track | null {
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
    artwork: coverImage || image || Logo,
    duration: audioSource.durationMs / 1000,
    pitchAlgorithm: PitchAlgorithm.Voice,
  }
  return track
}

type UIState = {
  isVisible: boolean
  isExpanded: boolean
}

/**
 * HeadlessAudioPlayer is a wrapper around react-native-track-player without any react-native UI.
 * The player is controlled through events received from the webview.
 */
const HeadlessAudioPlayer = ({}) => {
  const appState = useRef<AppStateStatus>(AppState.currentState)
  const playerState = usePlaybackState()
  const [uiState, setUIState] = useState<UIState>({
    isVisible: false,
    isExpanded: false,
  })

  const [activeTrack, setActiveTrack] = useState<AudioObject | null>(null)
  const lazyInitializedTrack = useRef<AudioObject | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const {
    notifyStateSync,
    notifyQueueAdvance,
    notifyError,
    notifyMinimize,
  } = useWebViewHandlers()

  const resetCurrentTrack = async () => {
    lazyInitializedTrack.current = null
    setActiveTrack(null)
    await TrackPlayer.reset()
  }

  const handleError = (error: Error) => {
    console.error(error)
    notifyError(error)
  }

  /**
   * Send all relevant state of the track-player to the web-ui.
   * If the player hasn't been initialized yet we send an update based on changes to the
   * lazy initialized track.
   */
  const syncStateWithWebUI = useCallback(async () => {
    const [track, state, duration, position, playbackRate] = await Promise.all([
      getCurrentPlayingTrack(),
      TrackPlayer.getState(),
      TrackPlayer.getDuration(),
      TrackPlayer.getPosition(),
      TrackPlayer.getRate(),
    ])

    if (isInitialized) {
      notifyStateSync({
        itemId: track?.itemId,
        playerState: state,
        duration,
        position,
        playbackRate: Math.round(playbackRate * 100) / 100,
      })
    } else if (lazyInitializedTrack?.current) {
      notifyStateSync({
        itemId: lazyInitializedTrack.current.item.id,
        playerState: State.None,
        duration: 0,
        position: lazyInitializedTrack.current.initialTime ?? 0,
        playbackRate,
        forceUpdate: true,
      })
    }
  }, [notifyStateSync, isInitialized])

  /**
   * Inform web-view to advance audio-queue.
   */
  const handleQueueAdvance = useCallback(
    async (itemId: string) => {
      notifyQueueAdvance(itemId)
      syncStateWithWebUI()
    },
    [syncStateWithWebUI, notifyQueueAdvance],
  )

  /**
   * Handle play event. If the queue was not initialized yet, initialize it.
   * After the initialization, the track will seek its initialTime if given.
   * @param initialTime to seek to when playing
   */
  const handlePlay = useCallback(
    async (initialTime?: number) => {
      try {
        if (!isInitialized) {
          setIsInitialized(true)
          if (
            lazyInitializedTrack?.current &&
            lazyInitializedTrack.current !== null &&
            lazyInitializedTrack.current.track !== null
          ) {
            setActiveTrack(lazyInitializedTrack.current)
            await TrackPlayer.add(lazyInitializedTrack.current.track)
            initialTime = lazyInitializedTrack.current.initialTime
          }
        }

        if (initialTime) {
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
        }

        syncStateWithWebUI()
        return
      } catch (error) {
        handleError(error)
      }
    },
    [syncStateWithWebUI, isInitialized, playbackRate],
  )

  const handlePause = useCallback(async () => {
    try {
      await TrackPlayer.pause()
      syncStateWithWebUI()
    } catch (error) {
      handleError(error)
    }
  }, [syncStateWithWebUI, handleError])

  /**
   * Called before the audio-player is visually hidden.
   */
  const handleStop = useCallback(async () => {
    try {
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
  const handleSeek = useCallback(
    async payload => {
      try {
        if (isInitialized) {
          await TrackPlayer.seekTo(payload)
        } else if (lazyInitializedTrack?.current) {
          lazyInitializedTrack.current = {
            ...lazyInitializedTrack.current,
            initialTime: payload,
          }
        }
        syncStateWithWebUI()
      } catch (error) {
        handleError(error)
      }
    },
    [syncStateWithWebUI, isInitialized],
  )

  /**
   * Forward the given amount of seconds.
   */
  const handleForward = useCallback(
    async (payload: number) => {
      try {
        if (isInitialized) {
          const position = await TrackPlayer.getPosition()
          await TrackPlayer.seekTo(position + payload)
        } else if (lazyInitializedTrack?.current) {
          lazyInitializedTrack.current = {
            ...lazyInitializedTrack.current,
            initialTime: Math.max(
              (lazyInitializedTrack?.current.initialTime || 0) + payload,
              0,
            ),
          }
        }
        syncStateWithWebUI()
      } catch (error) {
        handleError(error)
      }
    },
    [syncStateWithWebUI, isInitialized],
  )

  /**
   * Rewind the given amount of seconds.
   */
  const handleBackward = useCallback(
    async (payload: number) => {
      try {
        if (isInitialized) {
          const position = await TrackPlayer.getPosition()
          await TrackPlayer.seekTo(position - payload)
        } else if (lazyInitializedTrack?.current) {
          lazyInitializedTrack.current = {
            ...lazyInitializedTrack.current,
            initialTime: Math.max(
              (lazyInitializedTrack?.current.initialTime || 0) - payload,
              0,
            ),
          }
        }
        syncStateWithWebUI()
      } catch (error) {
        handleError(error)
      }
    },
    [syncStateWithWebUI, isInitialized],
  )

  /**
   * Set the playback rate.
   */
  const handlePlaybackRate = useCallback(
    async (payload: number) => {
      try {
        setPlaybackRate(payload)
        await TrackPlayer.setRate(payload)
        syncStateWithWebUI()
      } catch (error) {
        handleError(error)
      }
    },
    [syncStateWithWebUI],
  )

  useTrackPlayerEvents([Event.PlaybackQueueEnded], async event => {
    console.log('event', event)
    switch (event.type) {
      /**
       * Call advance queue when the current track has ended.
       * To remove it from the queue
       */
      case Event.PlaybackQueueEnded:
        const [queue, position, duration] = await Promise.all([
          TrackPlayer.getQueue(),
          TrackPlayer.getPosition(),
          TrackPlayer.getDuration(),
        ])

        // On iOS the queueEnded event is fired when the track just started playing on iOS.
        // If the ended event is fired but the first item is the activeItem and
        // positon and current are 0, ignore the ended event.
        if (
          queue.length > 0 &&
          queue[0].itemId === activeTrack?.item.id &&
          (duration <= 0 || position < duration - PLAYBACK_ENDED_OFFSET)
        ) {
          return
        }

        // Handle faulty event emission when nothing is tracked
        if (activeTrack === null || activeTrack.item?.id === undefined) {
          console.log('faulty playback-ended update', {
            activeTrack,
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
  })

  // Sync the state with the webview if in a playing state
  useInterval(
    () => syncStateWithWebUI(),
    [State.Buffering, State.Playing].includes(playerState)
      ? SYNC_INTERVAL_WHILE_PLAYING
      : [State.Connecting].includes(playerState)
      ? SYNC_INTERVAL_WHILE_CONNECTING
      : null,
  )

  // Handle events from web-ui
  useWebViewEvent<number | undefined>(AudioEvent.PLAY, handlePlay)
  useWebViewEvent<void>(AudioEvent.PAUSE, handlePause)
  useWebViewEvent<void>(AudioEvent.STOP, handleStop)
  useWebViewEvent<void>(AudioEvent.SEEK, handleSeek)
  useWebViewEvent<number>(AudioEvent.FORWARD, handleForward)
  useWebViewEvent<number>(AudioEvent.BACKWARD, handleBackward)
  useWebViewEvent<number>(AudioEvent.PLAYBACK_RATE, handlePlaybackRate)

  type AudioSetupData = {
    item: AudioQueueItem
    autoPlay?: boolean
    initialTime?: number
    playbackRate?: number
    coverImage?: string
  }

  useWebViewEvent<AudioSetupData>(
    AudioEvent.SETUP_TRACK,
    async ({
      item,
      autoPlay,
      initialTime,
      playbackRate,
      coverImage,
    }: AudioSetupData) => {
      try {
        const nextItem = {
          item,
          track: getTrackFromAudioQueueItem(item, coverImage),
          initialTime: initialTime || 0,
        }
        if (!nextItem.track) {
          console.warn('no track found for item', item)
          return
        }

        if (playbackRate) {
          setPlaybackRate(playbackRate)
        }

        // During the initial setup, the player safes the track into a ref.
        // In addtion, the initial playbackrate can also be set.
        if (!isInitialized) {
          lazyInitializedTrack.current = nextItem
          return
        }
        setActiveTrack(nextItem)
        await TrackPlayer.reset()
        await TrackPlayer.add(nextItem.track)

        syncStateWithWebUI()
        if (autoPlay) {
          await handlePlay(initialTime)
        } else if (initialTime) {
          await TrackPlayer.skip(0, initialTime)
        }
        return Promise.resolve()
      } catch (error) {
        handleError(error)
      }
    },
  )

  // Sync teh UI-state of the web-player to allow for special handling of back button in android
  useWebViewEvent<UIState>(AudioEvent.UPDATE_UI_STATE, (newUIState: UIState) =>
    setUIState(newUIState),
  )

  // On android the back button should cause the expanded player to minimize on back button press
  useEffect(() => {
    if (Platform.OS === 'android') {
      const handleBackPress = () => {
        if (uiState.isExpanded) {
          notifyMinimize()
          return true // The event is considered as handled, the OS won't bubble up the back-press
        }
        return false // Event is bubbled up for the OS to handle
      }

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress,
      )
      return () => backHandler.remove()
    }
  }, [uiState, notifyMinimize])

  // Sync the player state with the webview when the app comes to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        syncStateWithWebUI()
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return null
}

export default HeadlessAudioPlayer;
