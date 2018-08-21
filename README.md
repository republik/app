# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.

## Usage

[Setup React Native for projects with native code](https://facebook.github.io/react-native/docs/getting-started.html).

Bootstrap your .env file:

```bash
cp .env.example .env.dev
```

Install and run:

```bash
yarn
yarn run run-ios-dev # or run via Xcode
# Start your Android virtual device from Android Studio
yarn run run-android-dev
```

For testing on real iOS devices: Make sure to switch on automatic signing in the general project settings.

Follow the guides to get up to speed on messages api (between `republik-frontend` and the `app`), fonts, notifications and deployments.

### Guides

* [Messages API](docs/messages.md)
* [Publishing](docs/publishing.md)
* [Notifications](docs/notifications.md)
* [Fonts](docs/fonts.md)

### Universal Links

The app is configured to responde to `www.republik.ch` links.

You can test this in the iOS simulator by running [following command](https://objectivetidbits.com/working-with-universal-links-on-ios-simulator-adffb7767801):

```bash
xcrun simctl openurl booted "https://www.republik.ch/feed"
```

[Testing](https://developer.android.com/training/app-links/verify-site-associations#testing) with Android virtual devices:

```bash
adb shell am start -a android.intent.action.VIEW \
    -c android.intent.category.BROWSABLE \
    -d "https://www.republik.ch/feed"
```

## Key Screens

![Login, Front and Article Screen](docs/keyscreens.svg)

The login screen needs to be implemented specifically for the app, probably in the web front end. The existing front and article views can be used as is.

