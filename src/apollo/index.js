import React from 'react'
import { AsyncStorage } from 'react-native'
import { ApolloProvider } from 'react-apollo'
import CookieManager from 'react-native-cookies'
import ApolloClient from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { withClientState } from 'apollo-link-state'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { CachePersistor } from 'apollo-cache-persist'
import { HOME_URL, LOGIN_URL } from '../constants'
import { getMenuStateQuery } from './queries'
import { link } from './link'

const defaults = {
  url: LOGIN_URL,
  user: null,
  menuActive: false,
  article: null
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
    color: String
  }

  type Mutation {
    logout(): Boolean
    toggleMenu(): Boolean
    login(user: User!): Boolean
    setUrl(url: String!): Boolean
    setArticle(article: Article!): Boolean
  }

  type Query {
    me: User
    url: String
    menuActive: Boolean,
    currentArticle: Article
  }
`

export const resolvers = {
  Mutation: {
    login: (_, { user }, context) => {
      context.cache.writeData({ data: {
        url: HOME_URL,
        user: { ...user, __typename: 'User' }
      } })
      return true
    },
    logout: (_, variables, context) => {
      CookieManager.clearAll()
      context.cache.writeData({ data: {
        url: LOGIN_URL,
        user: null
      } })
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
      const format = article ? article.meta.format : null
      const value = article ? {
        id: article.id,
        color: format ? format.meta.color : null,
        __typename: 'Article'
      } : null

      context.cache.writeData({ data: { article: value } })
      return true
    }
  }
}

const withApollo = WrappedComponent => () => {
  const clientState = { defaults, typeDefs, resolvers }
  const cache = new InMemoryCache()
  const persistor = new CachePersistor({ cache, storage: AsyncStorage })
  const stateLink = withClientState({ ...clientState, cache })
  const composedLink = ApolloLink.from([stateLink, link])
  const client = new ApolloClient({ cache, link: composedLink })

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
