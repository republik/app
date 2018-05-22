import React, { Component } from 'react';
import { Linking } from 'react-native';

const deepLinkingWrapper = WrappedComponent => (
  class extends Component {
    componentDidMount() {
      Linking.addEventListener('url', this.handleOpenURL);
    }

    componentWillUnmount() {
      Linking.removeEventListener('url', this.handleOpenURL);
    }

    handleOpenURL(event) {
      const route = event.url.replace(/.*?:\/\//g, '');
      console.log(route);
    }

    render() {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
);

export default deepLinkingWrapper;
