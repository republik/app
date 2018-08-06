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
      discussionId
      discussionPath
      audioSource
    }
  }
`

const getCurrentUrlQuery = gql`
  query GetCurrentUrl {
    url @client
  }
`

const getCurrentAudioQuery = gql`
  query GetCurrentAudio {
    audio @client
    playbackState @client
  }
`

const countQuery = gql`
  query discussion($discussionId: ID!) {
    discussion(id: $discussionId) {
      id
      comments(first: 0) {
        totalCount
      }
    }
  }
`

const pendingAppSignInQuery = gql`
  query pendingAppSignIn {
    pendingAppSignIn {
      title
      body
      expiresAt
      verificationUrl
    }
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

const withCurrentUrl = graphql(getCurrentUrlQuery, {
  props: ({ data: { url } }) => ({
    currentUrl: url
  })
})

const withAudio = graphql(getCurrentAudioQuery, {
  props: ({ data: { audio, playbackState } }) => ({
    audio,
    playbackState
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

const pendingAppSignIn = graphql(pendingAppSignInQuery, {
  options: {
    fetchPolicy: 'network-only'
  },
  skip: props => !props.me,
  props: ({ data }) => {
    return {
      pendingAppSignIn: data.pendingAppSignIn,
      refetchPendingSignInRequests: data.refetch
    }
  }
})

const withCount = graphql(countQuery, {
  options: ({ article }) => ({
    pollInterval: 10000,
    variables: {
      discussionId: article ? article.discussionId : null
    }
  }),
  skip: props => !props.article,
  props: ({ data: { discussion } }) => ({
    count: discussion && discussion.comments.totalCount
  })
})

export {
  me,
  withCount,
  withAudio,
  withMenuState,
  withCurrentUrl,
  pendingAppSignIn,
  getMenuStateQuery,
  withCurrentArticle,
  pendingAppSignInQuery
}
