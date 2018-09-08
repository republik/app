import gql from 'graphql-tag'
import { graphql, compose } from 'react-apollo'

const getCurrentUrlQuery = gql`
  query GetCurrentUrl {
    url @client
  }
`

const getCurrentAudioQuery = gql`
  query GetCurrentAudio {
    audio @client {
      id
      url
      title
      sourcePath
    }
  }
`
const getPlaybackStateQuery = gql`
  query GetPlaybackState {
    playbackState @client
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

const withCurrentUrl = graphql(getCurrentUrlQuery, {
  props: ({ data: { url } }) => ({
    currentUrl: url
  })
})

const withAudio = graphql(getCurrentAudioQuery, {
  props: ({ data: { audio } }) => ({
    audio
  })
})

const withPlaybackState = graphql(getPlaybackStateQuery, {
  props: ({ data: { playbackState } }) => ({
    playbackState
  })
})

const withMe = graphql(gql`
  query me {
    user @client {
      id
    }
  }
`, {
  props: ({ data }) => {
    return {
      me: data.user
    }
  }
})

const pendingAppSignIn = compose(
  withMe,
  graphql(pendingAppSignInQuery, {
    skip: props => !props.me,
    options: {
      fetchPolicy: 'network-only'
    },
    props: ({ data }) => {
      return {
        pendingAppSignIn: data.pendingAppSignIn,
        refetchPendingSignInRequests: data.refetch
      }
    }
  })
)

export {
  withMe,
  withAudio,
  withPlaybackState,
  withCurrentUrl,
  pendingAppSignIn
}
