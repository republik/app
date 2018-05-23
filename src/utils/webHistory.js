// Injected code to spy on browser's navigation history
// Native WebView onNavigationStateChange does not recognize SPA page transitions,
// so we inject code that enables to spy on changes, sending messages.
export const listenHistoryImpl = function() {
  var pushState = window.history.pushState;
  var back = window.history.back;

  function updateNavState(currTitle) {
    setTimeout(function() {
      window.postMessage(
        location.protocol + '//' + location.host + location.pathname
      );
    }, 100);
  };

  window.history.pushState = function(state) {
    updateNavState();
    return pushState.apply(window.history, arguments);
  };

  window.history.back = function() {
    updateNavState();
    return back.apply(window.history);
  };

  window.onload = function() {
    updateNavState();
  };

  window.onpopstate = function() {
    updateNavState();
  };

  window.onhashchange = function() {
    updateNavState();
  };

  new MutationObserver(function(mutations) {
    updateNavState(mutations[0].target.text);
  }).observe(
    document.querySelector('title'),
    { attributes: true, childList: true }
  );

  new WebKitMutationObserver(function(mutations) {
    updateNavState(mutations[0].target.text);
  }).observe(
    document.querySelector('title'),
    { attributes: true, childList: true }
  );
};

// Implementation IIFE ready to inject
export const listenHistory = `(${listenHistoryImpl.toString()})()`;
