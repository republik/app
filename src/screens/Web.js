import React, { Component, Fragment } from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { parseURL } from '../utils/url';
import WebView from '../components/WebView';
import { FEED_URL, OFFERS_PATH, NOTIFICATIONS_PATH } from '../constants';

const RESTRICTED_PATHS = [
  // LOGIN_PATH,
  OFFERS_PATH,
];

class Web extends Component {
  state = { loading: true };

  setLoading = debounce(value => {
    this.setState({ loading: value });
  }, 150);

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url);

    // Redirect to feed after login
    if (url.path === NOTIFICATIONS_PATH) {
      if (url.params.type === 'email-confirmed') {
        this.setLoading(false);
        this.props.setUrl({ variables: { url: FEED_URL } });
      } else {
        this.setLoading(true);
      }
      return;
    }

    this.props.setUrl({ variables: { url: data.url } });
  }

  onLoadStart = () => {
    this.setLoading(true);

    if (this.props.screenProps.onLoadStart) {
      this.props.screenProps.onLoadStart();
    }
  }

  onLoadEnd = () => {
    this.setLoading(false);

    if (this.props.screenProps.onLoadEnd) {
      this.props.screenProps.onLoadEnd();
    }
  }

  webViewWillTransition = (from, to) => {
    const fromUrl = parseURL(from);
    const toUrl = parseURL(to);

    if (RESTRICTED_PATHS.includes(toUrl.path)) {
      Linking.openURL(to);
      return false;
    }

    return true;
  }

  render() {
    const { screenProps, setUrl, data } = this.props;

    return (
      <WebView
        style={styles.webView}
        source={{uri: data.url}}
        loading={this.state.loading}
        onLoadEnd={this.onLoadEnd}
        onLoadStart={this.onLoadStart}
        webViewWillTransition={this.webViewWillTransition}
        onNavigationStateChange={this.onNavigationStateChange}
      />
    );
  }
}

var styles = StyleSheet.create({
  webView: {
    flex: 1,
  }
});

const getData = graphql(gql`
  query GetData {
    url @client
    loggedIn @client
  }
`);

const setUrl = graphql(gql`
  mutation SetUrl($url: String!) {
    setUrl(url: $url) @client
  }
`, { name: 'setUrl' });

export default compose(getData, setUrl)(Web);
