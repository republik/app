Welcome to the app wiki!

# Testing 
CAVEAT: Notifications can only be properly tested once a beta version is released which used the production frontend (requires https://github.com/orbiting/republik-frontend/pull/515 to be merged).

How to: Always state your device & OS and go through the list.

### StartUu
* Startup, check that Splashscreen reacts to the phone's theme (dark/light)
* Check if setting Nightmode to "automatic" works. (switch phone theme and see if changes work)

### Login
* Log in to the App
* Log in to Republik.ch on the web and confirm login with App (should spawn notification)
* Upload a new profile picture

### Notifications
* Check notification reception
* Check that clicking on notification navigates to the appropriate place

**Audio Player**
* Launch Audioplayer in App
* Control Audioplayer in App (start, stop, skip forward backward, close, reopen, pan progress)
* Control Audio from control panel
* Launch Audioplayer in web and skip to a certain position. Let play for 5 sec. Open same audio in app and check if progress is preserved. (and vice versa)
* Click on Audio Title and check if it navigates to the document
* Check if margins of audioplayer look correct

**Other**
* Check if video playback works as expected (inline & fullscreen or external (filmingo))
* Open a gallery image and check that the status bar disappears and changes color

# Send test-notification

If you are testing the notification functionality in a production build of the app, the following graphql query can be executed to send a notification to the devices of the currently logged in user.

```gql
mutation {
  sendTestPushNotification(
    title: "[Test] title"
    body: "body"
    url: "https://www.republik.ch/2022/11/02/journal"
    type: "discussion"
    tag: "" // Enter a new unique value each time you execute this query
  )
}
```
