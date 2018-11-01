import React, { Component, PropTypes } from 'react'
import { polyfill } from 'react-lifecycles-compat'
import { any, bool, number, object, string } from 'prop-types'
import { connect } from 'react-redux'
import { ProgressBarAndroid } from 'react-native'

import { DEFAULT_SCOPE } from './loading_bar_ducks'

export const UPDATE_TIME = 200
export const MAX_PROGRESS = 99
export const PROGRESS_INCREASE = 10
export const ANIMATION_DURATION = UPDATE_TIME * 4
export const TERMINATING_ANIMATION_DURATION = UPDATE_TIME / 2

const initialState = {
  percent: 0,
  status: 'hidden',
}

class LoadingBar extends Component {
  static propTypes = {
    className: string,
    loading: number,
    maxProgress: number,
    progressIncrease: number,
    showFastActions: bool,
    updateTime: number,
    scope: string,
    style: any,
  }

  static defaultProps = {
    className: '',
    loading: 0,
    maxProgress: MAX_PROGRESS,
    progressIncrease: PROGRESS_INCREASE,
    showFastActions: false,
    style: {},
    updateTime: UPDATE_TIME,
    scope: DEFAULT_SCOPE,
  }

  static shouldStart(props, state) {
    return (
      props.loading > 0 && ['hidden', 'stopping'].indexOf(state.status) >= 0
    )
  }

  static shouldStop(props, state) {
    return (
      props.loading === 0 && ['starting', 'running'].indexOf(state.status) >= 0
    )
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (LoadingBar.shouldStart(nextProps, prevState)) {
      return { status: 'starting' }
    }

    if (LoadingBar.shouldStop(nextProps, prevState)) {
      return { status: 'stopping' }
    }

    return null
  }

  state = { ...initialState }

  componentDidMount() {
    if (this.state.status === 'starting') {
      this.start()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.status !== this.state.status) {
      if (this.state.status === 'starting') {
        this.start()
      }

      if (this.state.status === 'stopping') {
        this.stop()
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.progressIntervalId)
    clearTimeout(this.terminatingAnimationTimeoutId)
  }

  start() {
    this.setState({ status: 'running' })
  }

  stop() {
    const terminatingAnimationDuration =
      this.isShown() || this.props.showFastActions
        ? TERMINATING_ANIMATION_DURATION
        : 0

    this.terminatingAnimationTimeoutId = setTimeout(
      this.reset,
      terminatingAnimationDuration,
    )

    this.setState({ percent: 100 })
  }

  reset = () => {
    this.terminatingAnimationTimeoutId = null
    this.setState(initialState)
  }

  newPercent = (percent, progressIncrease) => 50

  simulateProgress = () => {
    this.setState((prevState, { maxProgress, progressIncrease }) => {
      let { percent } = prevState
      const newPercent = this.newPercent(percent, progressIncrease)

      if (newPercent <= maxProgress) {
        percent = newPercent
      }

      return { percent }
    })
  }

  isShown() {
    return this.state.percent > 0 && this.state.percent <= 100
  }

  render() {
    if (this.state.status === 'hidden') {
      return null
    }

    return (
      <ProgressBarAndroid
        color={this.props.color}
        style={this.props.style}
        styleAttr="Horizontal"
        indeterminate
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  loading: state.loadingBar[ownProps.scope || DEFAULT_SCOPE],
})

polyfill(LoadingBar)
const ConnectedLoadingBar = connect(mapStateToProps)(LoadingBar)

export { LoadingBar, ConnectedLoadingBar as default }
