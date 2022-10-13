import { useEffect, useRef, useState } from "react"
import TrackPlayer, { Event, useTrackPlayerEvents } from "react-native-track-player"

/**
 * Returns the current-track which is updated with every PlaybackTrackChanged event sent by `react-native-track-player`.
 * @returns index of the currentTrack in the queue
 */
const useCurrentTrack = (): number | null => {
    const [currentTrack, setCurrentTrack] = useState<number | null>(null);
    const currentRef = useRef<number | null>(null);


    useTrackPlayerEvents(
        [Event.PlaybackTrackChanged],
        async (event) => {
            if (event.type !== Event.PlaybackTrackChanged) {
                return
            }

            const current = await TrackPlayer.getCurrentTrack()
            setCurrentTrack(current)
        }
    )

    return currentTrack;
}

export default useCurrentTrack
