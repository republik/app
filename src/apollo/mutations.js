import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const login = graphql(gql`
  mutation Login($user: User) {
    login(user: $user) @client
  }
`, { name: 'login' })

const logout = graphql(gql`
  mutation Logout {
    logout @client
  }
`, { name: 'logout' })

const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' })

const setAudio = graphql(gql`
  mutation SetAudio($url: String, $title: String, $sourcePath: String) {
    setAudio(url: $url, title: $title, sourcePath: $sourcePath) @client
  }
`, { name: 'setAudio' })

const upsertDevice = graphql(gql`
  mutation UpsertDevice($token: ID!, $information: DeviceInformationInput!) {
    upsertDevice(token: $token, information: $information) {
      id
    }
  }
`, { name: 'upsertDevice' })

const rollDeviceToken = graphql(gql`
  mutation RollDeviceToken($oldToken: String!, $newToken: String!) {
    rollDeviceToken(oldToken: $oldToken, newToken: $newToken) {
      id
    }
  }
`, { name: 'rollDeviceToken' })


export {
  login,
  setUrl,
  logout,
  setAudio,
  upsertDevice,
  rollDeviceToken
}
