# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most views are provided by [republik-frontend](https://github.com/republik/plattform/tree/main/apps/www) and rendered in a web view.

## License

The logo (republik_logo.png) is property of its owner (Project R), and may not be reproduced without permission.

The source code is «BSD 3-clause» licensed.

## General Setup

[Setup React Native for projects with native code](https://facebook.github.io/react-native/docs/getting-started.html).

### Env

Bootstrap your .env files:

```sh
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

If `FRONTEND_BASE_URL` is changed you have to clear the babel loader cache:

```sh
rm -rf node_modules/.cache/babel-loader/*
```

### Environment Setup
Building the app requires a Mac running MacOS Ventura. 

For React Native Dependencies see: [Setting up the development environment](https://reactnative.dev/docs/environment-setup?package-manager=yarn&guide=native)

Tested software versions for building the app (the latest iOS build was created on 08.09.23 using these versions):
- Xcode@14.3.1
- macOS@13.4.1
- node@18
 
To build the current app via Terminal, the Terminal needs to run in Rosetta 2 (Right Click on Terminal App in Finder and under "Get Info" select Rosetta 2).

Other Xcode, node or macOS versions might cause issues.

### Install

```sh
yarn
cd ios
pod install
```

### Additional Setup

- [Publishing with Fastlane](docs/publishing.md)
- [Private Fonts](docs/fonts.md)

## Run Dev

### With Local Frontend and Production API

Runs the app in a simulator and use localhost build of `republik-frontend` with [yaproxy](https://github.com/orbiting/proxy) for api. 

in `republik-frontend`:

```sh
npm run dev
npm run yaproxy
```

in `app`:

```sh
yarn run ios
yarn run android
```

Optionally specify simulator: `yarn run ios --simulator iPhone 11`

### Run with Staging Frontend

Set a remote `FRONTEND_BASE_URL` in `.env.staging` and the run:

```sh
yarn run ios-staging
yarn run android-staging
```

### Universal Links

The app is configured to responde to `www.republik.ch` links.

You can test this in the iOS simulator by running [following command](https://objectivetidbits.com/working-with-universal-links-on-ios-simulator-adffb7767801):

```sh
xcrun simctl openurl booted "https://www.republik.ch/feed"
```

[Testing](https://developer.android.com/training/app-links/verify-site-associations#testing) with Android virtual devices:

```sh
adb shell am start -a android.intent.action.VIEW \
    -c android.intent.category.BROWSABLE \
    -d "https://www.republik.ch/feed"
```

### Notifications

On iOS you can drag the `notification.apns` and `notification-authorization.apns` file onto the simulator for testing.
