# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most, if not all views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.

## Key Screens

![Login, Front and Article Screen](docs/keyscreens.svg)

The login screen needs to be implemented specifically for the app, probably in the web front end. The existing front and article views can be used as is.

**Other important screens:**
- feed (existing, chronological list of articles)
- notifiction list (new)

## Frame

As a first step we'll customized the web frame based on user agent detection, see #X.

In a second step we might want to integrate deeply. Hide the whole frame via user agent detection and do a native frame.

[## Publishing](docs/publishing.md)
