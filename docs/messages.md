# Messages

## Frontend -> App

### navigation

Triggered every time the WebView's navigation (url) changes

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | navigation |
| url      | WebView's new URL | - |
| canGoBack | Boolean flag for back navigation | - |

> This is possible due to JS injection on the WebView JS runtime

### share

Trigger native share dialog

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | share |
| payload      | meta data | {} |
| payload.title | share title | - |
| payload.message | share text, optional | - |
| payload.url | share url, appended to / sent as message on android | - |
| payload.subject | email subject, iOS only | - |
| payload.dialogTitle | android only | - |

See `react-native`s [`Share.share`](https://facebook.github.io/react-native/docs/share).

### vibrate

Trigger `react-native`s [`Vibration.vibrate`](https://facebook.github.io/react-native/docs/vibration)

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | vibrate |
| payload      | vibration data | {} |
| payload.pattern | duration number or vibration pattern as array of numbers, on iOS the duration of the vibration is not configurable—only wait times inbetween | - |
| payload.repeat | bool, loop, you will need to send cancel true | - |
| payload.cancel | bool, stops vibrating when truthy | - |

See `react-native`s [`Share.share`](https://facebook.github.io/react-native/docs/share).

### graphql

GraphQL network request to be resolved app-side

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | graphql |
| data      | Operation data | - |
| data.id      | Operation unique identifier. Useful for binding requests and responses | - |
| data.payload      | GraphQL operation description | - |

### start / stop

GraphQL subscription request to be resolved app-side

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | start/stop |
| id      | Operation unique identifier. Useful for binding requests and responses | - |
| payload      | GraphQL operation description | - |

### log

Log something from frontend into app's console

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | log |
| data      | String to log in app's console | - |

### fullscreen-enter

Triggered by the frontend when displaying fullscreen content (e.g. gallery)

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | fullscreen-enter |

### fullscreen-exit

Triggered from the frontend when closing fullscreen content (e.g. gallery)

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | fullscreen-exit |

### play-audio

Trigger native audio player

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | play-audio |
| payload      | meta data | {} |
| payload.url   | url to a aac, mp3 or ogg file | - |
| payload.title | title | - |
| payload.sourcePath  | path to source page | - |

##  App -> Frontend

### graphql

Sends GraphQL response back to the frontend instance

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | graphql |
| id      | Operation unique identifier | - |
| payload      | Operation response data | - |

### data / error / complete

Sends GraphQL subscription responses back to the frontend instance

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | data / error / complete |
| id      | Subscription unique identifier | - |
| payload      | Subscription response data | - |

### scroll-to-top

Scrolls to the top of the WebView's page

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | scroll-to-top |
