import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { INITIAL_URL, FEED_URL } from '../constants'
import { getMenuStateQuery } from './queries'

const defaults = {
  url: INITIAL_URL,
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

const withApollo = WrappedComponent => () => {
  const clientState = { defaults, typeDefs, resolvers }
  const cache = new InMemoryCache()
  const stateLink = withClientState({ ...clientState, cache })

  persistCache({ cache, storage: AsyncStorage, debounce: 500 })

  const link = ApolloLink.from([stateLink])
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
