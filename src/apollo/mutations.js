import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export const withClientSignIn = graphql(gql`
  mutation ClientSignIn($user: User) {
    signIn(user: $user) @client
  }
`, { name: 'clientSignIn' })

export const withClientSignOut = graphql(gql`
  mutation ClientSignOut {
    signOut @client
  }
`, { name: 'clientSignOut' })

export const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' })

export const setAudioMutation = gql`
  mutation SetAudio($url: String, $title: String, $sourcePath: String, $mediaId: String) {
    setAudio(url: $url, title: $title, sourcePath: $sourcePath, mediaId: $mediaId) @client
  }
`

export const setAudio = graphql(setAudioMutation, { name: 'setAudio' })

const upsertCurrentMediaProgressMutation = gql`
  mutation upsertMediaProgress($mediaId: ID!, $secs: Float!) {
    upsertMediaProgress(mediaId: $mediaId, secs: $secs) {
      id
      mediaId
      secs
      createdAt
      updatedAt
      __typename
    }
  }
`

export const upsertCurrentMediaProgress = graphql(upsertCurrentMediaProgressMutation, { name: 'upsertCurrentMediaProgress' }) 

export const upsertDevice = graphql(gql`
  mutation UpsertDevice($token: ID!, $information: DeviceInformationInput!) {
    upsertDevice(token: $token, information: $information) {
      id
    }
  }
`, { name: 'upsertDevice' })

export const rollDeviceToken = graphql(gql`
  mutation RollDeviceToken($oldToken: String!, $newToken: String!) {
    rollDeviceToken(oldToken: $oldToken, newToken: $newToken) {
      id
    }
  }
`, { name: 'rollDeviceToken' })

export const setPlaybackStateMutation = gql`
  mutation SetPlaybackState($state: String!) {
    setPlaybackState(state: $state) @client
  }
`

export const setPlaybackState = graphql(setPlaybackStateMutation, { name: 'setPlaybackState' })
