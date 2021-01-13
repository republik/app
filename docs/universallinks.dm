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
