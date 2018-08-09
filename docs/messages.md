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

### article-opened

Triggered from the frontend every time an article is visited

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | article-opened |
| payload      | Article JSON data | - |

> This is used to get proper data to show in native nabvar

### article-closed

Triggered from the frontend every time a user leaves from an article's page

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | article-closed |


### gallery-opened

Triggered from the frontend every time the gallery is opened

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | gallery-opened |

> This is used to get proper data to show in native nabvar

### gallery-closed

Triggered from the frontend every time the gallery is closed

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | gallery-closed |

### close-menu

Triggered from the frontend to inform that the menu popover was closed

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | close-menu |

### show-secondary-nav

Triggered from the frontend to inform that the secondary menu popover was opened

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | show-secondary-nav |

### hide-secondary-nav

Triggered from the frontend to inform that the secondary menu popover was closed

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | hide-secondary-nav |

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

### open-menu

Triggered from the app to tell frontend he should open menu popover

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | open-menu |

### close-menu

Triggered from the app to tell frontend he should close menu popover

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | close-menu |

### open-secondary-menu

Triggered from the app to tell frontend he should open secondary menu popover

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | open-secondary-menu |

### close-secondary-menu

Triggered from the app to tell frontend he should close secondary menu popover

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | close-secondary-menu |

### subheader-opened

Triggered from the app to tell frontend the subheader was opened

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | subheader-opened |

### subheader-closed

Triggered from the app to tell frontend the subheader was closed

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | subheader-closed |

### scroll-to-top

Scrolls to the top of the WebView's page

| Key        | Description           | Value  |
| ------------- |:-------------:| -----:|
| type      | Message type | scroll-to-top |
