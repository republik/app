import { useEffect, useRef } from 'react';
import WebViewEventEmitter from './WebViewEventEmitter';

type EventHandler<E> = (eventData: E) => Promise<void> | void;

/**
 * useWebViewEvent allows to subscribe to events emitted by the web-ui.
 * @param eventName The name of the event to subscribe to.
 * @param callback The handler to call when the event is emitted.
 */
function useWebViewEvent<E = Event>(
  eventName: string, 
  callback: EventHandler<E>
) {
  const savedCallback = useRef<EventHandler<E>>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  })

  useEffect(() => {
    const wrappedHandler = (eventData: E) => {
      console.log('useWebViewEvent: received', eventName, eventData);
      return savedCallback?.current(eventData);
    }

    console.log('useWebViewEvent: registering handler for', eventName);
    WebViewEventEmitter.addListener(eventName, wrappedHandler)
    return () => {
      console.log('useWebViewEvent: Removing event handler for', eventName);
      WebViewEventEmitter.removeListener(eventName, wrappedHandler)
    }
  }, [eventName])
}

export default useWebViewEvent
