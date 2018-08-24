import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

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
  props: ({ data }) => {
    return {
      pendingAppSignIn: data.pendingAppSignIn,
      refetchPendingSignInRequests: data.refetch
    }
  }
})

export {
  me,
  withAudio,
  withCurrentUrl,
  pendingAppSignIn,
  pendingAppSignInQuery
}
