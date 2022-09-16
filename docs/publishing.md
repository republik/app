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

Be sure to pass an app-specific password for your Apple ID to the `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` environment variable.
When running the command below.
To generate a new app-specific password, head over to [appleid.apple.com](appleid.apple.com)

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

#### Staging Version

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

#### Production Version

Will do the same as above but with `.env.production`. Can then be released via [play.google.com/apps/publish](https://play.google.com/apps/publish).

```sh
yarn deploy-android-production type:[version-type]
```

##### APK File

Download «Distribution APK» file from Google Play Console and upload to our [S3 Bucket](https://s3.console.aws.amazon.com/s3/buckets/republik-assets?prefix=assets%2Fapp%2F&region=eu-central-1#).

Make sure to update the [APK download-link](https://republik.ch/app/apk/latest), so that the link points to the newly uploaded APK-file.
You can update the redirect-link by running the following GraphQL mutation on api.republik.ch:

```graphql
  mutation {
    updateRedirection(
      id:"7e9c49dc-7f1c-43f2-919f-eb92c17ccf2b"
      source:"/app/apk/latest",
      target: --> Paste your link for the uploaded APK-file here <---
      status:302
    ) {
      target
    }
  }
```
The link is used on the following pages:
 - [App](https://republik.ch/app)
 - [Gebrauchsanleitung](https://republik.ch/gebrauchsanleitung)
 - Inside a banner that's shown to users running a legacy-version of the app.

## Tagging

Make sure to tag versions that you release to production:

```sh
git tag v1.0.1-ios
git tag v1.0.1-android
git push --tags
```
