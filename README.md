# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.

## Usage

[Setup React Native for projects with native code](https://facebook.github.io/react-native/docs/getting-started.html).

Bootstrap your .env file:

```
cp .env.example .env.development
```

If `FRONTEND_BASE_URL` is changed you have to clear the babel loader cache:

```
rm -rf node_modules/.cache/babel-loader/*
```

Install:

```
yarn
cd ios
pod install
```

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
