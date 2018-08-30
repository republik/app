/* eslint-disable no-undef */

export const injectedJavaScriptImpl = function () {
  // Navigation spy
  // Injected code to spy on browser's navigation history
  // Native WebView onNavigationStateChange does not recognize SPA page transitions,
  // so we inject code that enables to spy on changes, sending messages.

  var pushState = window.history.pushState
  var replaceState = window.history.replaceState
  var back = window.history.back

  function updateNavState (url, canGoBack) {
    var hash = location.hash !== '' ? '?' + location.hash : ''
    var prefix = location.protocol + '//' + location.host

    window.postMessage(JSON.stringify({
      type: 'navigation',
      url: url ? (prefix + url) : (prefix + location.pathname + hash),
      canGoBack
    }))
  };

  window.history.pushState = function () {
    updateNavState(arguments[2], true)
    return pushState.apply(window.history, arguments)
  }

  window.history.replaceState = function () {
    updateNavState(arguments[2])
    return replaceState.apply(window.history, arguments)
  }
}

// Implementation IIFE ready to inject
export const injectedJavaScript = `(${injectedJavaScriptImpl.toString()})()`
