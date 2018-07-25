/* eslint-disable no-undef */

export const injectedJavaScriptImpl = function () {
  // Navigation polyfills
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

  window.history.back = function () {
    updateNavState()
    return back.apply(window.history)
  }

  window.onload = function () {
    updateNavState()
  }

  window.onpopstate = function () {
    updateNavState()
  }

  window.onhashchange = function () {
    updateNavState()
  }

  // Scrolling polyfills

  document.addEventListener('message', function (event) {
    var message = JSON.parse(event.data)

    if (message.type === 'scroll-to-top') {
      window.scrollTo(0, 0)
    } else if (message.type === 'goto') {
      window.location.href = message.url
    } else if (message.type === 'pushRoute') {
      window.Router.pushRoute(message.url)
    }
  })

  var onScroll = function () {
    window.postMessage(JSON.stringify({
      type: 'scroll',
      payload: { x: window.scrollX, y: window.scrollY }
    }))
  }

  window.addEventListener('scroll', onScroll)
}

// Implementation IIFE ready to inject
export const injectedJavaScript = `(${injectedJavaScriptImpl.toString()})()`
