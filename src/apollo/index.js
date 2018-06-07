import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import CookieManager from 'react-native-cookies'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { createHttpLink } from 'apollo-link-http'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { API_URL, FRONTEND_BASE_URL, LOGIN_URL, FEED_URL } from '../constants'
import { getMenuStateQuery } from './queries'
import { parseURL } from '../utils/url'

const frontendUrl = parseURL(FRONTEND_BASE_URL)

const defaults = {
  url: LOGIN_URL,
  user: null,
  menuActive: false
}

const typeDefs = `
  type User {
    id: String
    email: String
    name: String
    lastName: String
    firstName: String
    initials: String
    portrait: String
  }

  type Mutation {
    logout(): Boolean
    toggleMenu(): Boolean
    login(user: User!): Boolean
    setUrl(url: String!): String
  }

  type Query {
    me: User
    url: String
    menuActive: Boolean,
  }
`

export const resolvers = {
  Mutation: {
    login: (_, { user }, context) => {
      context.cache.writeData({ data: {
        url: FEED_URL,
        user: { ...user, __typename: 'User' }
      } })
      return true
    },
    logout: (_, variables, context) => {
      CookieManager.clearAll()
      context.cache.writeData({ data: { user: null } })
      return false
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url } })
      return url
    },
    toggleMenu: async (_, variables, context) => {
      const previous = context.cache.readQuery({ query: getMenuStateQuery })
      const next = !previous.menuActive
      context.cache.writeData({ data: { menuActive: next } })
      return next
    }
  }
}

const customFetch = async (uri, options) => {
  const cookieRegex = /connect\.sid=([^;]*)/
  const res = await fetch(uri, options)
  const sessionCookie = cookieRegex.exec(res.headers.get('set-cookie'))

  if (sessionCookie) {
    await CookieManager.set({
      name: 'connect.sid',
      value: sessionCookie[1],
      domain: frontendUrl.host,
      origin: frontendUrl.host,
      path: '/',
      version: '1',
      expiration: '2030-01-01T12:00:00.00-00:00'
    })
  }

  return res
}

const withApollo = WrappedComponent => () => {
  const clientState = { defaults, typeDefs, resolvers }
  const cache = new InMemoryCache()
  const stateLink = withClientState({ ...clientState, cache })

  persistCache({ cache, storage: AsyncStorage, debounce: 500 })

  const http = createHttpLink({ uri: API_URL, fetch: customFetch })
  const link = ApolloLink.from([stateLink, http])
  const client = new ApolloClient({ cache, link })

  return (
    <ApolloProvider client={client}>
      <WrappedComponent {...this.props} />
    </ApolloProvider>
  )
}

export * from './queries'
export * from './mutations'

export default withApollo
