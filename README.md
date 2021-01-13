# Republik App

A thin native app for persistent auth, app store presence and convenience.

Most views are provided by [republik-frontend](https://github.com/orbiting/republik-frontend) and rendered in a web view.


## Documentation
[How to setup publishing](docs/publishing.md)
[How to add fonts](docs/fonts.md)
[How to test universal links](docs/fonts.md)


## General Setup
[Setup React Native for projects with native code](https://facebook.github.io/react-native/docs/getting-started.html).

### Bootstrap your .env file:
```
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

If `FRONTEND_BASE_URL` is changed you have to clear the babel loader cache:

```
rm -rf node_modules/.cache/babel-loader/*
```

### Copy font files to project
[How to include font files](docs/fonts.md)

### Copy font files to project
[How to include font files](docs/fonts.md)

### Install:
```
yarn
cd ios
pod install
```

## Run Dev

### Option 1) Run with Local Frontend and Proxy
Runs the app in a simulator and use localhost build of `republik-frontend` with [yaproxy](https://github.com/orbiting/proxy) for api. 

```
npm i yaproxy -g
PORT=5000 TARGET=https://api.republik.ch CORS_ORIGIN=http://localhost:3010 npx yaproxy
```

in `republik-frontend`:
```
npm run dev
```

in `republik-app`:
```
yarn run ios
yarn run android
```

optionally specify simulator: `yarn run ios --simulator iPhone 11`

### Option 2) Run with staing frontend
Uses ux.republik.ch

```
yarn run ios-staging
yarn run android-staging
```



