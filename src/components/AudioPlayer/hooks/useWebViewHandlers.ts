import { useCallback } from 'react';
import { State } from "react-native-track-player"
import { useGlobalState } from "../../../GlobalState"
import { AudioEvent } from "../AudioEvent"

type AudioPlayerState = {
    itemId: string
    playerState: State
    duration: number
    position: number
    playbackRate: number
}

type WebViewHandlers = {
    notifyStateSync: (state: AudioPlayerState) => void
    notifyQueueAdvance: () => void
    notifyError: (error: Error) => void
}

const useWebViewHandlers = (): WebViewHandlers => {
    const { dispatch } = useGlobalState()

    const syncState = useCallback((state: AudioPlayerState) => 
        dispatch({
            type: "postMessage", 
            content: {
                type: AudioEvent.SYNC,
                payload: {
                    itemId: state.itemId,
                    playerState: state.playerState,
                    duration: state.duration,
                    currentTime: state.position,
                    playbackRate: state.playbackRate,
                }
            }
        }), [dispatch]
    )

    const advanceQueue = useCallback(() => dispatch({
            type: "postMessage",
            content: {
                type: AudioEvent.QUEUE_ADVANCE,
            }
        }), [dispatch]
    )

    const handleError = useCallback((error: Error) => {
        dispatch({
            type: "postMessage", 
            content: {
                type: AudioEvent.ERROR,
                payload: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            } 
        })
    }, [dispatch])

    return {
        notifyStateSync: syncState,
        notifyQueueAdvance: advanceQueue,
        notifyError: handleError,
    }
}

export default useWebViewHandlers
