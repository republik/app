import React from 'react'
import {
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native'
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg'
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
    <>
      {Platform.OS === 'android' && (
        <View
          style={{
            position: 'absolute',
            top: -12,
            zIndex: 1,
            width: '100%',
          }}>
          <Svg height={12} width="100%">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor="#000000" stopOpacity={0} key="1" />
                <Stop
                  offset={1}
                  stopColor="#000000"
                  stopOpacity={0.08}
                  key="2"
                />
              </LinearGradient>
            </Defs>
            <Rect height={12} width="100%" fill="url(#grad)" />
          </Svg>
        </View>
      )}
      <View style={[styles.container, { backgroundColor: colors.overlay }]}>
        <SafeAreaView edges={['right', 'left']}>
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
                if (position <= 10) {
                  TrackPlayer.seekTo(0)
                } else {
                  TrackPlayer.seekTo(position - 10 * playbackRate)
                }
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
                  if (audio.currentTime >= duration - 5) {
                    // if less than 10s in, set to beginning
                    TrackPlayer.play()
                    TrackPlayer.seekTo(0)
                  }
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
                if (duration - position <= 30) {
                  // if less than 30s remain, set to duration
                  TrackPlayer.seekTo(duration)
                } else {
                  TrackPlayer.seekTo(position + 30 * playbackRate)
                }
              }}
            />
          </View>
          <ProgressBar
            audio={audio}
            expanded={true}
            playbackRate={playbackRate}
          />
          <View style={styles.rateSelectContainer}>
            {[
              { speed: 0.5, label: '0,5×' },
              { speed: 0.75, label: '0,75×' },
              { speed: 1, label: '1×' },
              { speed: 1.5, label: '1,5×' },
              { speed: 2, label: '2×' },
            ].map(rate => (
              <TouchableOpacity
                key={rate.speed}
                style={{ marginHorizontal: 16 }}
                onPress={() => {
                  TrackPlayer.setRate(rate.speed)
                  setPlaybackRate(rate.speed)
                }}>
                <Text
                  style={[
                    {
                      fontWeight:
                        rate.speed === playbackRate ? 'bold' : 'normal',
                      color: colors.text,
                    },
                    styles.rateSelector,
                  ]}>{`${rate.label}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </>
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
