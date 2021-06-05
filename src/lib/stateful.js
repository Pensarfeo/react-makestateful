/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */
import React, {Component} from 'react'

export const filterStateByScope = (scope, state) => {
  if (scope !== 'default') return state[scope]
  return state
}

const reduceShouldUpdateFns = (list, nextProps, nextState) => {
  if (list.length === 0) return true

  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  const returned = fn(nextProps, filterStateByScope(scope, nextState))
  if (typeof returned === 'boolean') return returned
  return reduceShouldUpdateFns(restFn, nextProps, nextState)
}

export class Stateful extends Component {
  constructor(props) {
    super(props)
    Object.assign(this, props._stateless_)
    this.setSelf(this)
  }

  render() {
    const {RenderComp} = this
    return <RenderComp />
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    const vals = this.lifeCycles.getSnapshotBeforeUpdate.forEach(([scope, fn]) => {
      fn(prevProps, filterStateByScope(scope, prevState))
    })
    return vals || null
  }

  componentDidMount() {
    this.lifeCycles.didMount.forEach(([type, fn]) => {
      fn()
    })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.lifeCycles.didUpdate.forEach(([scope, fn]) => {
      fn(prevProps, filterStateByScope(scope, prevState), snapshot)
    })
  }

  // FIXME: ShouldUpdate should skip the first round
  shouldComponentUpdate(nextProps, nextState) {
    return reduceShouldUpdateFns(this.lifeCycles.shouldUpdate, nextProps, nextState)
  }

  componentWillUnmount() {
    this.lifeCycles.willUnmount.forEach(([_, fn]) => {
      fn()
    })
  }
}

export function buildStateful(getDerivedStateFromProps, getDerivedStateFromError) {
  class NStateful extends Component {
    constructor(props) {
      super(props)
      Object.assign(this, props._stateless_)
      this.setSelf(this)
    }

    render() {
      const {RenderComp} = this
      return <RenderComp />
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
      this.lifeCycles.getSnapshotBeforeUpdate.forEach(([scope, fn]) => {
        fn(prevProps, filterStateByScope(scope, prevState))
      })
    }

    componentDidMount() {
      this.lifeCycles.didMount.forEach(([type, fn]) => {
        fn()
      })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      this.lifeCycles.didUpdate.forEach(([scope, fn]) => {
        fn(prevProps, filterStateByScope(scope, prevState), snapshot)
      })
    }

    // FIXME: ShouldUpdate should skip the first round
    shouldComponentUpdate(nextProps, nextState) {
      return reduceShouldUpdateFns(this.lifeCycles.shouldUpdate, nextProps, nextState)
    }

    componentWillUnmount() {
      this.lifeCycles.willUnmount.forEach(([_, fn]) => {
        fn()
      })
    }

    componentDidCatch(error, info) {
      this.lifeCycles.willUnmount.forEach(([_, fn]) => {
        fn(error, info)
      })
    }
  }

  if (getDerivedStateFromProps) Stateful.getDerivedStateFromProps = getDerivedStateFromProps
  if (getDerivedStateFromError)Stateful.getDerivedStateFromError = getDerivedStateFromError

  return Stateful
}
