import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const toggleMenu = graphql(gql`
  mutation ToggleMenu {
    toggleMenu @client
  }
`, { name: 'toggleMenu' })

const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' })

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

const signIn = graphql(gql`
  mutation SignIn($email: String!, $context: String, $consents: [String!]) {
    signIn(email: $email, context: $context, consents: $consents) {
      phrase
    }
  }
`, { name: 'signIn' })

const signOut = graphql(gql`
  mutation SignOut {
    signOut
  }
`, { name: 'signOut' })

export { toggleMenu, setUrl, login, logout, signIn, signOut }
