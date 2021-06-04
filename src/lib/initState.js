/* eslint-disable accessor-pairs */

/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */
import React from 'react'

export class NameTracker {
  constructor(type) {
    this.type = type
    this.names = []
  }

  add = (name) => {
    if (this.names.includes(name)) {
      throw Error(`${name} is already included in the ${this.type}, you can't add a name key more than once`)
    }
    this.names.push(name)
  }
}

class On {
  constructor(scope, lifeCycles) {
    this.scope = scope
    this.locked = false
    this.lifeCycles = lifeCycles
  }

  set didUpdate(fun) {if (!this.locked) this.lifeCycles.didUpdate.push([this.scope, fun])}
  set didMount(fun) {if (!this.locked) this.lifeCycles.didMount.push([this.scope, fun])}
  set willUnmount(fun) {if (!this.locked) this.lifeCycles.willUnmount.push([this.scope, fun])}
  set getSnapshotBeforeUpdate(fun) {if (!this.locked) this.lifeCycles.getSnapshotBeforeUpdate.push([this.scope, fun])}
  set shouldUpdate(fun) {if (!this.locked) this.lifeCycles.shouldUpdate.push([this.scope, fun])}
  set didCatch(fun) {if (!this.locked) this.lifeCycles.didCatch.push([this.scope, fun])}

  lock() {
    this.locked = true
  }
}

const cleanProps = (props) => {
  const cleanProps = {...props}
  delete cleanProps._stateless_
  delete cleanProps._render_
  delete cleanProps._contexes_
  delete cleanProps._shouldUpdatFns_

  return cleanProps
}

export default function initializeStatelessComponent (props, render, className) {
  this.className = className
  let self = this
  this.setSelf = (val) => self = val

  this.contexes = []
  this.defaultContextValues = {}
  this.initProps = function () {return {...props, ...this.defaultContextValues}}

  this.addContext = (name, context, fn) => {
    this.contextNameTracker.add(name)
    this.defaultContextValues[name] = context.Consumer._currentValue
    this.contexes.push([name, context, fn])
  }

  this.getFullState = function () {return this.state}

  this.makeState = function (name = 'default', val) {
    return (val) => {
      this.stateNameTracker.add(name)
      this.state[name] = val
      return [() => self.state[name], this.setStateFraction(name)]
    }
  }
  this.makeState = this.makeState.bind(this)

  this.makeOn = function (name) {
    this.lifeNameTracker.add(name)
    this.ons[name] = new On(name, this.lifeCycles)
    return this.ons[name]
  }
  this.makeOn = this.makeOn.bind(this)

  this.setStateFraction = function(name) {
    return (val, cb) => {
      self.setState((state) => {
        const stateFraction = state[name]
        let toNewState = val
        if (typeof val === 'function') {
          toNewState = val(stateFraction)
        }
        const newStateFraction = (stateFraction.toString() === '[object Object]') ? {...stateFraction, ...toNewState} : toNewState
        return {...state, [name]: newStateFraction}
      }, cb)
    }
  }

  this.setScopedStateFraction = function(scope) {
    return (name) => (val, cb) => {
      self.setState((state) => {
        const stateFraction = state[scope][name]
        let toNewState = val
        if (typeof val === 'function') {
          toNewState = val(stateFraction)
        }
        const newStateScopeFraction = (stateFraction.toString() === '[object Object]') ? {...stateFraction, ...toNewState} : toNewState
        return {...state, [scope]: {...state[scope], [name]: newStateScopeFraction}}
      }, cb)
    }
  }

  this.scopedMakeState = function (scope = 'default') {
    return (name) => (val) => {
      this.stateNameTracker.add(scope)
      this.stateNameTracker.add(`${scope}.${name}`)
      this.state[scope] = {[name]: val}
      return [() => self.state[scope][name], this.setScopedStateFraction(scope)(name)]
    }
  }

  this.makeState = this.makeState.bind(this)

  this.statefulProvider = function(scope) {
    return {
      makeState: this.scopedMakeState(scope),
      getProps: this.getProps,
      on: this.makeOn(scope),
      addContext: this.addContext,
    }
  }

  this.statefullProvider = this.statefulProvider.bind(this)

  this.setStateFraction = this.setStateFraction.bind(this)

  this.getState = function () {return self.state}
  this.getState = this.getState.bind(this)

  this.getProps = function () {return cleanProps(self.props || this.initProps())}

  this.getProps = this.getProps.bind(this)

  this.getFullProps = function () {return self.props || this.initProps()}
  this.getFullProps = this.getFullProps.bind(this)

  this.stateNameTracker = new NameTracker('state')
  this.lifeNameTracker = new NameTracker('lifecycle scope')
  this.contextNameTracker = new NameTracker('context')

  this.state = {}
  this.ons = {}
  this.isHoc = false
  this.hoc = (Comp) => (props) => <Comp {...props} />

  this.getDerivedStateFromProps = null
  this.getDerivedStateFromErrors = null

  const setGetDerivedState = {
    set fromProps (v) {self.getDerivedStateFromProps = v},
    set fromError (v) {self.getDerivedStateFromError = v},
  }
  this.setHoc = (hoc, shouldUpdate) => this.hoc = hoc

  this.lifeCycles = {
    shouldUpdate: [],
    getSnapshotBeforeUpdate: [],
    didMount: [],
    didUpdate: [],
    willUnmount: [],
    didCatch: [],
  }

  this.RenderComp = render({
    makeState: this.makeState,
    getProps: this.getProps,
    on: this.makeOn.bind(this)('default'),
    setGetDerivedState: setGetDerivedState,
    addContext: this.addContext,
    setHoc: this.setHoc.bind(this),
    statefulProvider: this.statefullProvider.bind(this),
    getFullState: this.getFullState,
    forceUpdate: this.forceUpdate
  })

  return this
}
