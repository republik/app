import { useEffect } from 'react';
import WebViewEventEmitter from './WebViewEventEmitter';

type EventHandler<E> = (eventData: E) => Promise<void>;

/**
 * useWebViewEvent allows to subscribe to events emitted by the web-ui.
 * @param eventName The name of the event to subscribe to.
 * @param handler The handler to call when the event is emitted.
 */
function useWebViewEvent<E = Event>(eventName: string, handler: EventHandler<E>) {
  useEffect(() => {
    WebViewEventEmitter.addListener(eventName, handler)
    return () => {
        WebViewEventEmitter.removeListener(eventName, handler)
    }
  }, [eventName, handler])
}

export default useWebViewEvent
