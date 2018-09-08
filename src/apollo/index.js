import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { CachePersistor } from 'apollo-cache-persist'
import { SIGN_IN_URL } from '../constants'
import { link } from './link'

const defaults = {
  url: SIGN_IN_URL,
  user: null,
  audio: null,
  playbackState: null
}

const typeDefs = `
type User {
  id: ID!
}

type Audio {
  id: ID!
  url: String!
  title: String
  sourcePath: String
}
`

export const resolvers = {
  Mutation: {
    signIn: (_, { user }, context) => {
      context.cache.writeData({
        data: {
          user: { ...user, __typename: 'User' }
        }
      })
      return null
    },
    signOut: (_, variables, context) => {
      context.cache.writeData({ data: defaults })
      return null
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url } })
      return null
    },
    setAudio: async (_, variables, context) => {
      const { url, title, sourcePath } = variables
      const audio = url
        ? {
          __typename: 'Audio',
          // new id on every open
          // - triggers a re-render and starts playing again
          id: url + (new Date()).toISOString(),
          url,
          title,
          sourcePath
        }
        : null
      context.cache.writeData({ data: { audio } })
      return null
    },
    setPlaybackState: async (_, { state }, context) => {
      context.cache.writeData({ data: { playbackState: state } })
      return null
    }
  }
}

const clientState = { defaults, typeDefs, resolvers }
const cache = new InMemoryCache()
const persistor = new CachePersistor({ cache, storage: AsyncStorage })
const stateLink = withClientState({ ...clientState, cache })
const composedLink = ApolloLink.from([stateLink, link])

// Create apollo client and export it
export const client = new ApolloClient({ cache, link: composedLink })

const withApollo = WrappedComponent => () => {
  return (
    <ApolloProvider client={client}>
      <WrappedComponent {...this.props} persistor={persistor} />
    </ApolloProvider>
  )
}

export * from './link'
export * from './queries'
export * from './mutations'

export default withApollo
