import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState } from 'react-native';
import { compose } from 'recompose';
import codePush from './services/codePush';
import pushNotifications from './services/pushNotifications';

class App extends Component {
  render() {
    let progressView;

    if (this.props.progress) {
      progressView = (
        <Text style={styles.messages}>
          {this.props.progress.receivedBytes} of {this.props.progress.totalBytes} bytes received
        </Text>
      );
    }

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.props.sync}>
          <Text style={styles.syncButton}>Press for background sync</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.props.syncImmediate}>
          <Text style={styles.syncButton}>Press for dialog-driven sync</Text>
        </TouchableOpacity>
        {progressView}
        <TouchableOpacity onPress={this.props.getUpdateMetadata}>
          <Text style={styles.syncButton}>Press for Update Metadata</Text>
        </TouchableOpacity>
        <Text style={styles.messages}>{this.props.syncMessage || ""}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    paddingTop: 50
  },
  messages: {
    marginTop: 30,
    textAlign: "center",
  },
  syncButton: {
    color: "red",
    fontSize: 17
  }
});


export default compose(
  codePush,
  pushNotifications,
)(App);
