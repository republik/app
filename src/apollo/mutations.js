import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const toggleMenu = graphql(gql`
  mutation toggleMenu {
    toggleMenu @client
  }
`, { name: 'toggleMenu' });

export { toggleMenu };
