import React from 'react'
import {
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native'
import { useColorContext } from '../../utils/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import TrackPlayer from 'react-native-track-player'
import ProgressBar from './ProgressBar'
import { parseSeconds } from './index.js'

const ExpandedControls = ({
  audio,
  onTitlePress,
  isPlaying,
  position,
  playbackRate,
  setPlaybackRate,
  duration,
}) => {
  const { colors } = useColorContext()

  return (
    <View style={[styles.container, { backgroundColor: colors.overlay }]}>
      <SafeAreaView
        // style={{ justifyContent: 'flex-end' }}
        edges={['right', 'left']}>
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={onTitlePress}>
            <Text
              numberOfLines={2}
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}>
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
            size={36}
            color={colors.text}
            onPress={() => {
              // seekTo does not work on iOS unless playing
              TrackPlayer.play()
              TrackPlayer.seekTo(position - 10 * playbackRate)
            }}
          />
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={72}
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
              TrackPlayer.seekTo(position + 30 * playbackRate)
            }}
          />
        </View>
        <ProgressBar audio={audio} expanded={true} />
        <View style={styles.rateSelectContainer}>
          {[0.5, 0.75, 1, 1.5, 2].map(rate => (
            <TouchableOpacity
              key={rate}
              style={{ marginHorizontal: 16 }}
              onPress={() => {
                TrackPlayer.setRate(rate)
                setPlaybackRate(rate)
              }}>
              <Text
                style={[
                  {
                    fontWeight: rate === playbackRate ? 'bold' : 'normal',
                    color: colors.text,
                  },
                  styles.rateSelector,
                ]}>{`${rate}x`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 1,
  },
  titleContainer: {
    padding: 16,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 20,
    paddingBottom: 8,
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
  rateSelectContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateSelector: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'GT America',
  },
})

export default ExpandedControls
