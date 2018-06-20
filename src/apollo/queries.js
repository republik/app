import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

const getMenuStateQuery = gql`
  query GetMenuState {
    menuActive @client
  }
`

const getCurrentArticleQuery = gql`
  query GetCurrentArticle {
    article @client {
      color
    }
  }
`

const withMenuState = graphql(getMenuStateQuery, {
  props: ({ data: { menuActive } }) => ({
    menuActive
  })
})

const withCurrentArticle = graphql(getCurrentArticleQuery, {
  props: ({ data: { article } }) => ({
    article
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

export { me, withMenuState, getMenuStateQuery, withCurrentArticle }
