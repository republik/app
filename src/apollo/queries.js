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
      url
      title
      sourcePath
      opened
    }
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

const pendingAppSignIn = compose(
  me,
  graphql(pendingAppSignInQuery, {
    skip: props => !props.me,
    options: {
      fetchPolicy: 'network-only'
    },
    props: ({ data, ownProps: { me } }) => {
      return {
        pendingAppSignIn: data.pendingAppSignIn,
        refetchPendingSignInRequests: data.refetch
      }
    }
  })
)

export {
  me,
  withAudio,
  withCurrentUrl,
  pendingAppSignIn
}
