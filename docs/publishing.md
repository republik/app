# Publishing

This project uses [Fastlane](https://docs.fastlane.tools/) to automate deployment processes both for iOS and Android.
You can find the installation instructions [here](https://docs.fastlane.tools/#install-fastlane)

## iOS

### Setup

To set up the certificates and provisioning profiles on a new machine, you will have torun the following command inside the `./ios` directory:

```
fastlane match development
```

### Publish

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

## Android

Currently there is only one lane for Android to alpha releases. Both beta and production versions should be done via Google's Play Store Console, by promoting old alpha versions into any of these environments.

Before executing the deployment script, you should follow the next steps:

### Setup

**1. Copy .keystore file**

Copy the *[app-name].keystore* file used to sign the APK into *./android/app* folder. The deployment process will automatically get it to sign future APKs with it.

Check that the keystore file name matches the entry `MYAPP_RELEASE_STORE_FILE` present in *./android/gradle.properties*.

**2. Copy JSON key file**

This file contains Google service account credentials needed to give Fastlane access to publishing on our behalf. Copy this file also into *./android/app*, and check that it's name matches the value of `json_key_file` present in *./android/app/fastlane/Appfile*.

**3. Set keystore pass into Keychain Access**

The keystore has a password associated with it. To avoid having the password hardcoded in the project (without the .keystore file there's nothing someone can do, but extra security never hurts), we create a new password entry in MacOS Keychain Access app.

To do this, you just:

1. Open Keychain Access
2. Add a new password by pressing the plus sign
3. As name write the value of the entry `MYAPP_RELEASE_KEY_ALIAS` present in *./android/gradle.properties*. Ultimately you fill in the password that you used when you created the key using keytool

[Source](https://pilloxa.gitlab.io/posts/safer-passwords-in-gradle/)

The publishing process is already configured to find the password inside your Keychain Access.

**4. Setup Android project env variables**

Android native project has a separate .env file used in the publishing process. You will find a *.env.example* file with the empty fields you need to fill. Copy that file and rename it *.env*, and make sure all the keys are present before publishing.

### Publish

#### Alpha version

This will use `.env.staging`.

```sh
yarn deploy-android-staging type:[version-type]
```

`version-type` can be:
- patch *(default if not specified)*
- minor
- major

This process will:

1. Increment version code
2. Increment version name (patch if no `type` option passed)
3. Build signed APK
4. Upload APK to Google Play as new alpha version
5. Post success message in Slack

#### Alpha version pointing at Production

This will use `.env.production`.

```sh
yarn deploy-android-staging type:[version-type]
```

## Tagging

Make sure to tag versions that you release to production:

```sh
git tag v1.0.1-ios
git tag v1.0.1-android
git push --tags
```
