# Font installation

## 1- Copy fonts to project

Fonts are not shipped with the app codebase, so the first thing you have to do is copying the needed fonts to `/src/assets/fonts`.

## 2- Link fonts to project

To do this, just run

```sh
react-native link
```

> **Important:** Because this project uses a different Gradle version (Android), `react-native link` creates duplicate and not needed native code in `/android/settings.gradle`, `/android/app/build.gradle` and `/android/app/src/main/java/app/republik/MainApplication.java`. For the Font linking process, you should rollback changes in these files as they were before.

## 3- Ensure linking was successful

For android, you should see the fonts copied to `/android.app/src/assets/fonts`.
For ios, yo should see fonts listed on `/ios/orbitingapp/Info.plist`

### Source
- [React Native custom fonts](https://medium.com/react-native-training/react-native-custom-fonts-ccc9aacf9e5e)
