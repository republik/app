import React from 'react'
import { AsyncStorage } from 'react-native'
import ApolloClient from 'apollo-boost'
import { ApolloProvider } from 'react-apollo'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { isUserLoggedIn } from './authentication';
import { LOGIN_URL } from '../constants'
import { getMenuStateQuery } from '../apollo';

const defaults = {
  url: LOGIN_URL,
  loggedIn: false,
  menuActive: false
}

const typeDefs = `
  type Mutation {
    login(): Boolean
    logout(): Boolean
    toggleMenu(): Boolean
    setUrl(url: String!): String
  }

  type Query {
    url: String
    loggedIn: Boolean,
    menuActive: Boolean,
  }
`

export const resolvers = {
  Mutation: {
    login: (_, variables, context) => {
      context.cache.writeData({ data: {
        loggedIn: true
      }})
      return true
    },
    logout: (_, variables, context) => {
      context.cache.writeData({ data: {
        loggedIn: false
      }})
      return false
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url }})
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

const withApollo = WrappedComponent => () => {
  const cache = new InMemoryCache()

  persistCache({ cache, storage: AsyncStorage, debug: true })

  const client = new ApolloClient({
    cache,
    clientState: {
      defaults,
      typeDefs,
      resolvers
    }
  })

  return (
    <ApolloProvider client={client}>
      <WrappedComponent {...this.props} />
    </ApolloProvider>
  )
}

export default withApollo
