import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import TrackPlayer from 'react-native-track-player'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { CachePersistor } from 'apollo-cache-persist'
import { LOGIN_URL, HOME_URL } from '../constants'
import { getMenuStateQuery } from './queries'
import { link } from './link'

const defaults = {
  url: LOGIN_URL,
  user: null,
  menuActive: false,
  secondaryMenuActive: false,
  secondaryMenuVisible: false,
  article: null,
  audio: null,
  playbackState: TrackPlayer.STATE_NONE
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
    login(user: User!): Boolean
    setUrl(url: String!): Boolean
  }

  type Query {
    me: User
    withCurrentUrl: String
  }
`

export const resolvers = {
  Mutation: {
    login: (_, { user }, context) => {
      context.cache.writeData({ data: {
        url: HOME_URL,
        menuActive: false,
        user: { ...user, __typename: 'User' }
      } })
      return true
    },
    logout: (_, variables, context) => {
      context.cache.writeData({ data: defaults })
      return false
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url } })
      return true
    },
    setAudio: async (_, { audio }, context) => {
      const data = audio ? { audio } : { audio, playbackState: TrackPlayer.STATE_NONE }
      context.cache.writeData({ data })
      return true
    },
    setPlaybackState: async (_, { state }, context) => {
      context.cache.writeData({ data: { playbackState: state } })
      return true
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
