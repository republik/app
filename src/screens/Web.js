import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import WebView from '../components/WebView';
import { FEED_URL } from '../constants';

class Web extends Component {
  componentDidMount() {
    if (this.props.data.loggedIn) {
      this.goToFeed();
    }
  }

  componentWillReceiveProps(nextProps){
    console.log(nextProps);
  }

  goToFeed = () => {
    this.props.setUrl({
      variables: { url: FEED_URL }
    });
  }

  onNavigationStateChange = ({ url }) => {
    console.log(url);
    // Sync url with global state
    this.props.setUrl({ variables: { url } });
  }

  render() {
    const { screenProps, data } = this.props;

    return (
      <WebView
        style={styles.webView}
        source={{uri: data.url}}
        onLoadEnd={screenProps.onLoadEnd}
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
