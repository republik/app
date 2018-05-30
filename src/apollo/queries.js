import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

const getMenuStateQuery = gql`
  query GetMenuState {
    menuActive @client
  }
`

const getMenuState = graphql(getMenuStateQuery, {
  props: ({ data: { menuActive } }) => ({
    menuActive
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

export { me, getMenuState, getMenuStateQuery }
