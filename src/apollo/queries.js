import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

const getMenuStateQuery = gql`
  query GetMenuState {
    menuActive @client
    secondaryMenuActive @client
    secondaryMenuVisible @client
  }
`

const getCurrentArticleQuery = gql`
  query GetCurrentArticle {
    article @client {
      id
      path
      color
      title
      series
      template
      discussion
      audioSource
    }
  }
`

const getCurrentUrlQuery = gql`
  query GetCurrentUrl {
    url @client
  }
`

const withMenuState = graphql(getMenuStateQuery, {
  props: ({ data: { menuActive, secondaryMenuVisible, secondaryMenuActive } }) => ({
    menuActive,
    secondaryMenuActive,
    secondaryMenuVisible
  })
})

const withCurrentArticle = graphql(getCurrentArticleQuery, {
  props: ({ data: { article } }) => ({
    article
  })
})

const withCurrentUrl: String = graphql(getCurrentUrlQuery, {
  props: ({ data: { url } }) => ({
    currentUrl: url
  })
})

const me = graphql(gql`
  query me {
    user @client {
      id
      name
      portrait
    }
  }
`, {
  props: ({ data }) => {
    return {
      me: data.user
    }
  }
})

export {
  me,
  withMenuState,
  withCurrentUrl,
  getMenuStateQuery,
  withCurrentArticle
}
