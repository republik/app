import React, { Component } from 'react'
import CodePush from 'react-native-code-push'
import { compose } from 'recompose'

const codePushWrapper = WrappedComponent => (
  class extends Component {
    state = {
      progress: null,
      syncMessage: null
    }

    codePushStatusDidChange (syncStatus) {
      switch (syncStatus) {
        case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
          this.setState({ syncMessage: 'Checking for update.' })
          break
        case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
          this.setState({ syncMessage: 'Downloading package.' })
          break
        case CodePush.SyncStatus.AWAITING_USER_ACTION:
          this.setState({ syncMessage: 'Awaiting user action.' })
          break
        case CodePush.SyncStatus.INSTALLING_UPDATE:
          this.setState({ syncMessage: 'Installing update.' })
          break
        case CodePush.SyncStatus.UP_TO_DATE:
          this.setState({ syncMessage: 'App up to date.', progress: false })
          break
        case CodePush.SyncStatus.UPDATE_IGNORED:
          this.setState({ syncMessage: 'Update cancelled by user.', progress: false })
          break
        case CodePush.SyncStatus.UPDATE_INSTALLED:
          this.setState({ syncMessage: 'Update installed and will be applied on restart.', progress: false })
          break
        case CodePush.SyncStatus.UNKNOWN_ERROR:
          this.setState({ syncMessage: 'An unknown error occurred.', progress: false })
          break
      }
    }

    codePushDownloadDidProgress (progress) {
      this.setState({ progress })
    }

    getUpdateMetadata = () => {
      CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING)
        .then((metadata) => {
          this.setState({ syncMessage: metadata ? JSON.stringify(metadata) : 'Running binary version', progress: false })
        }, (error: any) => {
          this.setState({ syncMessage: 'Error: ' + error, progress: false })
        })
    }

    /** Update is downloaded silently, and applied on restart (recommended) */
    sync = () => {
      CodePush.sync(
        {},
        this.codePushStatusDidChange.bind(this),
        this.codePushDownloadDidProgress.bind(this)
      )
    }

    /** Update pops a confirmation dialog, and then immediately reboots the app */
    syncImmediate = () => {
      CodePush.sync(
        { installMode: CodePush.InstallMode.IMMEDIATE, updateDialog: true },
        this.codePushStatusDidChange.bind(this),
        this.codePushDownloadDidProgress.bind(this)
      )
    }

    render () {
      return (
        <WrappedComponent
          sync={this.sync}
          syncImmediate={this.syncImmediate}
          getUpdateMetadata={this.getUpdateMetadata}
          syncMessage={this.state.syncMessage}
          progress={this.state.progress}
          {...this.props}
        />
      )
    }
  }
)

const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.MANUAL
}

export default compose(
  codePushWrapper,
  CodePush(codePushOptions)
)
