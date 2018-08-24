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

### scroll

Triggered every time the WebView's scroll changes

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | scroll |
| payload      | Object showing current scroll position | - |
| payload.x      | WebView current X scroll | - |
| payload.y      | WebView current Y scroll | - |

> This callback is debounced, except for when the scroll is near 0, in which we want immediate information for pull-to-refresh feature

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

### gallery-opened

Triggered from the frontend every time the gallery is opened

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | gallery-opened |

### gallery-closed

Triggered from the frontend every time the gallery is closed

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | gallery-closed |

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
