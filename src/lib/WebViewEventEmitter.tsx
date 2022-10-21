import { EventEmitter } from 'events';

/**
 * WebViewEventEmitter is a singleton that is used to emit events unhandled events from within
 * the onMessage function of the WebView.
 */
const WebViewEventEmitter = new EventEmitter();

export default WebViewEventEmitter
