# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most, if not all views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.

## Installation
1) Install NPM packages with your package manager of choice - i.e run yarn or npm install
2) Copy .env files into root project folder: `.env.dev`, `.env.staging`, `.env.production`
3) Follow the notifications setup instructions below

## Table of Contents

* [Messages API](docs/messages.md)
* [Publishing](docs/publishing.md)
* [Notifications](docs/notifications.md)
* [Fonts](docs/fonts.md)

## Key Screens

![Login, Front and Article Screen](docs/keyscreens.svg)

The login screen needs to be implemented specifically for the app, probably in the web front end. The existing front and article views can be used as is.

**Other important screens:**
- feed (existing, chronological list of articles)
- notifiction list (new)

## Frame

As a first step we'll customized the web frame based on user agent detection, see #X.

In a second step we might want to integrate deeply. Hide the whole frame via user agent detection and do a native frame.
