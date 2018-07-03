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

  function debounce (func, wait) {
    var timeout

    return function () {
      var context = this
      var args = arguments
      var later = function () {
        timeout = null
        func.apply(context, args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  document.addEventListener('message', function (event) {
    var message = JSON.parse(event.data)

    if (message.type === 'scroll-to-top') {
      window.scrollTo(0, 0)
    } else if (message.type === 'goto') {
      window.location.href = message.url
    }
  })

  var scrollY = 0

  var postScrollMessage = function () {
    window.postMessage(JSON.stringify({
      type: 'scroll',
      payload: { x: window.scrollX, y: window.scrollY }
    }))
  }

  var debouncedOnScroll = debounce(postScrollMessage, 150)

  var onScroll = function () {
    var oldScrollY = scrollY
    scrollY = window.scrollY

    if (window.scrollY < 15 || (oldScrollY === 0 && window.scrollY > 0)) {
      return postScrollMessage()
    }

    return debouncedOnScroll()
  }

  window.addEventListener('scroll', onScroll)
}

// Implementation IIFE ready to inject
export const injectedJavaScript = `(${injectedJavaScriptImpl.toString()})()`
