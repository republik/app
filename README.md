# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.

## Setup

[Setup React Native for projects with native code](https://facebook.github.io/react-native/docs/getting-started.html).

Bootstrap your .env file:

```
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
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

## Run Dev

### Option 1) Local with Proxy
Run the app in a simulator and use localhost build of `republik-frontend` with proxy for api.

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

## Publishing

This project uses [Fastlane](https://docs.fastlane.tools/) to automate deployment processes both for iOS and Android. You can find the installation instructions [here](https://docs.fastlane.tools)

### iOS Publishing

To set up the certificates and provisioning profiles on a new machine, you will have torun the following command inside the `./ios` directory:

```
fastlane match development
```

and select github as an option.

#### Staging version

This will use `.env.staging`.

```sh
yarn deploy-ios-staging
```

#### Production version

This will use `.env.production`.

```sh
yarn deploy-ios-production
```

This will also just upload a build to Apple that can be used for TestFlight and real releases.
