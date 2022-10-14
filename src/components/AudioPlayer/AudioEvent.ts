export enum AudioEvent {
  // Received from web
  PLAY = 'audio:play',
  PAUSE = 'audio:pause',
  STOP = 'audio:stop',
  SEEK = 'audio:seek',
  FORWARD = 'audio:forward',
  BACKWARD = 'audio:backward',
  PLAYBACK_RATE = 'audio:playbackRate',
  // Sent to web
  SYNC = 'audio:sync',
  QUEUE_ADVANCE = 'audio:queueAdvance',
  ERROR = 'audio:error',
}
