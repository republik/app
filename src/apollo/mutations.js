import { graphql } from 'react-apollo'
import queries from './queries'
import gql from 'graphql-tag'

const toggleMenu = graphql(gql`
  mutation ToggleMenu {
    toggleMenu @client
  }
`, { name: 'toggleMenu' })

const closeMenu = graphql(gql`
  mutation ToggleMenu {
    closeMenu @client
  }
`, { name: 'closeMenu' })

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

const signOut = graphql(gql`
  mutation SignOut {
    signOut
  }
`, {
  name: 'signOut',
  props: ({mutate, ownProps}) => ({
    signOut: () => mutate({
      refetchQueries: [{
        query: queries.me
      }]
    })
  })
})

const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' })

const setAudio = graphql(gql`
  mutation SetAudio($audio: String!) {
    setAudio(audio: $audio) @client
  }
`, { name: 'setAudio' })

const setArticle = graphql(gql`
  mutation SetArticle($article: Article!) {
    setArticle(article: $article) @client
  }
`, { name: 'setArticle' })

const enableSecondaryMenu = graphql(gql`
  mutation enableSecondaryMenu($open: Boolean) {
    enableSecondaryMenu(open: $open) @client
  }
`, { name: 'enableSecondaryMenu' })

const toggleSecondaryMenu = graphql(gql`
  mutation ToggleSecondaryMenu {
    toggleSecondaryMenu @client
  }
`, { name: 'toggleSecondaryMenu' })

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

const setPlaybackStateMutation = gql`
  mutation SetPlaybackState($state: String!) {
    setPlaybackState(state: $state) @client
  }
`

const shouldOpenOverlayNextTime = graphql(gql`
  mutation ShouldOpenOverlayNextTime($value: Boolean) {
    shouldOpenOverlayNextTime(value: $value) @client
  }
`, { name: 'shouldOpenOverlayNextTime' })

export {
  login,
  setUrl,
  logout,
  signOut,
  setAudio,
  closeMenu,
  setArticle,
  toggleMenu,
  upsertDevice,
  rollDeviceToken,
  enableSecondaryMenu,
  toggleSecondaryMenu,
  setPlaybackStateMutation,
  shouldOpenOverlayNextTime
}
