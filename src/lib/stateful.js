/* eslint-disable object-curly-spacing */
/* eslint-disable comma-dangle */
/* eslint-disable block-spacing */
import React, {Component} from 'react'
import {reduceShouldUpdateFns, filterStateByScope, NameTracker} from './utils'

class On {
  constructor(scope, lifeCycles) {
    this.scope = scope
    this.locked = false
    this.lifeCycles = lifeCycles
  }

  // set componentDidCatch (fun) {if (!this.locked) this.lifeCycles['componentDidCatch'].push(fun)}
  set didUpdate(fun) {if (!this.locked) this.lifeCycles.didUpdate.push([this.scope, fun])}
  set didMount(fun) {if (!this.locked) this.lifeCycles.didMount.push([this.scope, fun])}
  set willUnmount(fun) {if (!this.locked) this.lifeCycles.willUnmount.push([this.scope, fun])}
  set getSnapshotBeforeUpdate(fun) {if (!this.locked) this.lifeCycles.getSnapshotBeforeUpdate.push([this.scope, fun])}
  set shouldUpdate(fun) {if (!this.locked) this.lifeCycles.shouldUpdate.push([this.scope, fun])}

  lock() {
    this.locked = true
  }
}

const cleanProps = (props) => {
  const cleanProps = {...props}
  delete cleanProps.__internals__
  return cleanProps
}

export default class Statefull extends Component {
  constructor(props) {
    super()
    this.stateNameTracker = new NameTracker('state')
    this.lifeNameTracker = new NameTracker('lifecycle scope')

    this.state = {}
    this.ons = {}
    this.RenderComp = () => null

    this.lifeCycles = {
      didMount: [],
      didUpdate: [],
      shouldUpdate: [],
      willUnmount: [],
    }
  }

  getFullState = () => this.state

  makeState = (name = 'default') => (val) => {
    this.stateNameTracker.add(name)
    this.state[name] = val
    return [() => this.state[name], this.setStateFraction(name)]
  }

  statefullProvider = (props) => (name) => {
    const initState = this.makeState(name)
    return {
      initState,
      getProps: this.getProps(props),
      on: this.makeOn(name),
      addContext: this.addContext,
    }
  }

  makeOn = (name) => {
    this.lifeNameTracker.add(name)
    this.ons[name] = new On(name, this.lifeCycles)
    return this.ons[name]
  }

  setStateFraction = (name) => (val, cb) => {
    this.setState((state) => {
      const stateFraction = state[name]
      let toNewState = val
      if (typeof val === 'function') {
        toNewState = val(stateFraction)
      }

      const newStateFraction = (stateFraction.toString() === '[object Object]') ? {...stateFraction, ...toNewState} : toNewState
      return {...state, [name]: newStateFraction}
    }, cb)
  }

  // * all states are set with makeState
  // initState(newState) {
  //   initState(this)(newState)
  //   this.initState = () => {}
  // }

  getState = () => this.state
  getProps = (initProps) => () => cleanProps(this.props || initProps)
  getFullProps = (initProps) => () => this.props || initProps

  render() {
    const RenderComp = this.RenderComp
    const props = cleanProps(this.props)
    return <RenderComp {...props} />
  }

  componentDidMount() {
    const {props} = this
    const {statelessComponent, className, setHOC, addContext} = props.__internals__

    this.RenderComp = statelessComponent({
      makeState: this.makeState,
      getProps: this.getProps(props),
      on: this.makeOn('default'),
      addContext: addContext,
      setHOC,
      statefullProvider: this.statefullProvider(props),
      getFullState: this.getFullState,
      getFullProps: this.getFullProps(props)
    })

    this.RenderComp.displayName = className + '-Stateless'

    this.lifeCycles.didMount.forEach(([type, fn]) => {
      fn()
    })
    this.ons.default.lock()
  }

  shouldComponentUpdate(nextProps, nextState) {
    return reduceShouldUpdateFns(this.lifeCycles.shouldUpdate, nextProps, nextState)
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return null
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.lifeCycles.didUpdate.forEach(([scope, fn]) => {
      fn(prevProps, filterStateByScope(scope, prevState), snapshot)
    })
  }

  componentWillUnmount() {
    this.lifeCycles.willUnmount.forEach(([_, fn]) => {
      fn()
    })
  }
}
