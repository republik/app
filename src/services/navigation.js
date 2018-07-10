import { NavigationActions } from 'react-navigation'

let container

const setContainer = (c) => {
  container = c
}

const reset = (routeName, params) => {
  container.dispatch(
    NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({
          type: 'Navigation/NAVIGATE',
          routeName,
          params
        })
      ]
    })
  )
}

const navigate = (routeName, params) => {
  container.dispatch(
    NavigationActions.navigate({
      type: 'Navigation/NAVIGATE',
      routeName,
      params
    })
  )
}

const getCurrentRoute = () => {
  if (!container || !container.state.nav) {
    return null
  }

  return container.state.nav.routes[container.state.nav.index] || null
}

export default {
  setContainer,
  navigate,
  reset,
  getCurrentRoute
}
