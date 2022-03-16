import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useColorContext } from '../../utils/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import TrackPlayer from 'react-native-track-player'

import { parseSeconds } from './index.js'

const ExpandedControls = ({
  audio,
  onTitlePress,
  isPlaying,
  position,
  playbackRate,
  duration,
}) => {
  const { colors } = useColorContext()

  return (
    <View style={[styles.container, { backgroundColor: colors.overlay }]}>
      <View style={styles.titleContainer}>
        <TouchableOpacity onPress={onTitlePress}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.text }]}>
            {audio && audio.title}
          </Text>
        </TouchableOpacity>
        {duration > 0 && (
          <Text style={[styles.time, { color: colors.textSoft }]}>
            {parseSeconds(position / playbackRate)} /{' '}
            {parseSeconds(duration / playbackRate)}
          </Text>
        )}
      </View>
      <View style={styles.playbackContainer}>
        <Icon
          name="replay-10"
          size={30}
          color={colors.text}
          onPress={() => {
            // seekTo does not work on iOS unless playing
            TrackPlayer.play()
            TrackPlayer.seekTo(position - 10)
          }}
        />
        <Icon
          name={isPlaying ? 'pause' : 'play-arrow'}
          size={66}
          color={colors.text}
          style={{ marginHorizontal: 12 }}
          onPress={() => {
            if (isPlaying) {
              TrackPlayer.pause()
            } else {
              TrackPlayer.play()
            }
          }}
        />
        <Icon
          name="forward-30"
          size={30}
          color={colors.text}
          onPress={() => {
            // seekTo does not work on iOS unless playing
            TrackPlayer.play()
            TrackPlayer.seekTo(position + 30)
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  titleContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    paddingBottom: 6,
    textAlign: 'center',
    fontFamily: 'GT America',
  },
  time: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'GT America',
    fontVariant: ['tabular-nums'],
  },
  playbackContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default ExpandedControls
