import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import TrackPlayer from 'react-native-track-player'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { CachePersistor } from 'apollo-cache-persist'
import { LOGIN_URL } from '../constants'
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

  type Article {
    id: String
    path: String
    title: String
    color: String
    series: String
    template: String
    audioSource: String
    discussionId: String
    discussionPath: String
  }

  type Mutation {
    logout(): Boolean
    toggleMenu(): Boolean
    closeMenu(): Boolean
    login(user: User!): Boolean
    setUrl(url: String!): Boolean
    setArticle(article: Article!): Boolean
    toggleSecondayMenu(): Boolean
    enableSecondaryMenu(open: Boolean!): Boolean
  }

  type Query {
    me: User
    withCurrentUrl: String
    withMenuState: Boolean
    withCurrentArticle: Article
  }
`

export const resolvers = {
  Mutation: {
    login: (_, { user }, context) => {
      context.cache.writeData({ data: {
        menuActive: false,
        user: { ...user, __typename: 'User' }
      } })
      return true
    },
    logout: (_, variables, context) => {
      context.cache.writeData({ data: defaults })
      return false
    },
    toggleMenu: async (_, variables, context) => {
      const previous = await context.cache.readQuery({ query: getMenuStateQuery })
      const next = !previous.menuActive
      context.cache.writeData({ data: { menuActive: next } })
      return next
    },
    closeMenu: async (_, variables, context) => {
      context.cache.writeData({ data: { menuActive: false } })
      return false
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url } })
      return true
    },
    setArticle: async (_, { article }, context) => {
      const meta = article ? article.meta : {}
      const format = article ? meta.format : null
      const audioSource = article ? meta.audioSource || {} : {}

      const value = article ? {
        id: article.id,
        path: meta.path,
        title: meta.title,
        template: meta.template,
        color: format ? format.meta.color : null,
        series: meta.series ? meta.series.title : null,
        discussionPath: meta.discussion ? meta.discussion.meta.path : null,
        discussionId: meta.discussion ? meta.discussion.meta.discussionId : null,
        audioSource: audioSource.mp3 || audioSource.ogg || audioSource.aac || null,
        __typename: 'Article'
      } : null

      context.cache.writeData({ data: { article: value } })
      return true
    },
    enableSecondaryMenu: async (_, { open }, context) => {
      const active = !open ? { secondaryMenuActive: false } : {}
      context.cache.writeData({ data: { ...active, secondaryMenuVisible: open } })
      return true
    },
    toggleSecondaryMenu: async (_, variables, context) => {
      const previous = await context.cache.readQuery({ query: getMenuStateQuery })
      const next = !previous.secondaryMenuActive
      context.cache.writeData({ data: { secondaryMenuActive: next } })
      return next
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
