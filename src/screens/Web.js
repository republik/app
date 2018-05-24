import React, { Component, Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { parseURL } from '../utils/url';
import WebView from '../components/WebView';
import { FEED_URL } from '../constants';

class Web extends Component {
  state = { loading: true };

  setLoading = debounce(value => {
    this.setState({ loading: value });
  }, 150);

  onNavigationStateChange = (data) => {
    const url = parseURL(data.url);

    // Redirect to feed before login
    if (url.path === 'mitteilung') {
      if (url.params.type === 'email-confirmed') {
        this.setLoading(false);
        this.props.setUrl({ variables: { url: FEED_URL } });
      } else {
        this.setLoading(true);
      }
    }

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

  render() {
    const { screenProps, setUrl, data } = this.props;

    return (
      <WebView
        style={styles.webView}
        source={{uri: data.url}}
        loading={this.state.loading}
        onLoadEnd={this.onLoadEnd}
        onLoadStart={this.onLoadStart}
        automaticallyAdjustContentInsets={false}
        onNavigationStateChange={this.onNavigationStateChange}
        javaScriptEnabled
        startInLoadingState
        scalesPageToFit
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
