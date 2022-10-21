export enum AudioEvent {
  // Received from webview
  PLAY = 'audio:play',
  PAUSE = 'audio:pause',
  STOP = 'audio:stop',
  SEEK = 'audio:seek',
  FORWARD = 'audio:forward',
  BACKWARD = 'audio:backward',
  PLAYBACK_RATE = 'audio:playbackRate',
  SETUP_TRACK = 'audio:setupTrack',
  UPDATE_UI_STATE = 'audio:updateUIState',
  // Sent to webview
  SYNC = 'audio:sync',
  QUEUE_ADVANCE = 'audio:queueAdvance',
  ERROR = 'audio:error',
  MINIMIZE_PLAYER = 'audio:minimizePlayer',
}
