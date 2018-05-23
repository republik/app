import React from 'react';
import { AsyncStorage } from 'react-native';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { persistCache } from 'apollo-cache-persist'
import { isUserLoggedIn } from './authentication';
import { LOGIN_URL } from '../constants';

const defaults = {
  loggedIn: false,
  url: LOGIN_URL,
};

const typeDefs = `
  type Mutation {
    login(): Boolean
    logout(): Boolean
    setUrl(url: String!): String
  }

  type Query {
    url: String
    loggedIn: Boolean,
  }
`;

export const resolvers = {
  Mutation: {
    login: (_, variables, context) => {
      context.cache.writeData({ data: {
        loggedIn: true
      }});
      return true;
    },
    logout: (_, variables, context) => {
      context.cache.writeData({ data: {
        loggedIn: false
      }});
      return false;
    },
    setUrl: async (_, { url }, context) => {
      context.cache.writeData({ data: { url }});
      return url;
    },
  },
};

const withApollo = WrappedComponent => () => {
  const cache = new InMemoryCache();

  persistCache({ cache, storage: AsyncStorage, debug: true });

  const client = new ApolloClient({
    cache,
    clientState: {
      defaults,
      typeDefs,
      resolvers,
    }
  });

  return(
    <ApolloProvider client={client}>
      <WrappedComponent {...this.props} />
    </ApolloProvider>
  );
};

export default withApollo;
