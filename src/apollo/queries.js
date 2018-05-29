import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const getMenuStateQuery = gql`
  query GetMenuState {
    menuActive @client
  }
`;

const getMenuState = graphql(getMenuStateQuery, {
  props: ({ data: { menuActive } }) => ({
    menuActive
  }),
});

export { getMenuState, getMenuStateQuery };
