import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useColorContext } from '../../utils/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {
  useTrackPlayerProgress,
  usePlaybackState,
} from 'react-native-track-player'
import { useGlobalState } from '../../GlobalState'
import {
  FRONTEND_BASE_URL,
  AUDIO_PLAYER_PROGRESS_HEIGHT,
} from '../../constants'
const Controls = ({ seekTo, audio, togglePlayback, paused }) => {
  const { setPersistedState, setGlobalState } = useGlobalState()
  const { colors } = useColorContext()
  const { position, duration } = useTrackPlayerProgress()
  const playbackState = usePlaybackState()

  const parseSeconds = (value) => {
    if (value === null || value === undefined) return ''
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value - minutes * 60)
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  }

  const onTitlePress = () => {
    if (audio && audio.sourcePath) {
      setGlobalState({
        pendingUrl: `${FRONTEND_BASE_URL}${audio.sourcePath}`,
      })
    }
  }

  return (
    <View {...styles.controls}>
      <Icon
        name="replay-10"
        size={28}
        color={colors.text}
        onPress={() => seekTo(position - 10)}
      />
      <Icon
        name={playbackState == paused ? 'play-arrow' : 'pause'}
        size={46}
        color={colors.text}
        onPress={() => togglePlayback()}
      />
      <Icon
        name="forward-30"
        size={28}
        color={colors.text}
        onPress={() => seekTo(position + 30)}
      />
      <View style={styles.content}>
        <TouchableOpacity onPress={onTitlePress}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.text }]}>
            {audio && audio.title}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.time, { color: colors.text }]}>
          {parseSeconds(position)} / {parseSeconds(duration)}
        </Text>
      </View>
      <Icon
        name="close"
        size={35}
        color={colors.text}
        onPress={() =>
          setPersistedState({
            audio: null,
          })
        }
      />
    </View>
  )
}
const styles = StyleSheet.create({
  controls: {
    width: '100%',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: AUDIO_PLAYER_PROGRESS_HEIGHT,
  },
  content: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: 'GT America',
  },
  time: {
    fontSize: 14,
    fontFamily: 'GT America',
    fontVariant: ['tabular-nums'],
  },
})

export default Controls
