/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */
import React, { Component, Fragment } from 'react'

// const initState = (self) => (newState) => {
//   if (self.stateInitiated) return
//   self.state = newState
//   self.stateInitialized = true
// }

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

class NameTracker {
  constructor(type) {
    this.type = type
    this.names = []
  }

  add = (name) => {
    if (this.names.includes(name)) {
      throw Error(`${name} is already included in the ${this.type}, you can't add a state key more than once`)
    }
    this.names.push(name)
  }
}

const filterStateByScope = (scope, state) => {
  if (scope !== 'default') return state[scope]
  return state
}

const ContextChain = ({context, __render__, ...props}) => {
  const Render = __render__
  if (props.__contexes__.length === 0) return <Render {...props} __contexes__={context} />

  const [name, Context, shouldUpdateFn] = props.__contexes__.slice(-1)[0]
  const __contexes__ = props.__contexes__.slice(0, -1)
  const __shouldUpdatFns__ = props.__shouldUpdatFns__.concat([name, shouldUpdateFn])

  const newArgs = {...context}
  const newProps = {...props, __render__, __contexes__, __shouldUpdatFns__}

  return (
    <Context.Consumer>
      {(args) => {
        newArgs[name] = args
        return <ContextChain {...newProps} context={newArgs} __render__={__render__}/>
      }}
    </Context.Consumer>
  )
}

const buildContextChain = (contexes, render, __shouldUpdatFns__ = []) => (props) => {
  return (
    <ContextChain
      {...props}
      __contexes__={contexes}
      __render__={render}
      __shouldUpdatFns__={__shouldUpdatFns__}
    />
  )
}

const reduceContextShouldUpdateFns = (list, nextContextProps) => {
  if (list.length === 0) return true
  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  if (!fn) return reduceShouldUpdateFns(restFn, nextContextProps)
  const returned = fn(nextContextProps[scope])
  if (typeof returned === 'boolean') return returned
  return reduceContextShouldUpdateFns(restFn, nextContextProps)
}

class ContextElevator extends Component {
  componentDidMount = () => {
    this.props.__elevateContext__({...this.props.__contexes__, ...this.props.hoc })
  }

  componentDidUpdate = () => {
    this.props.__elevateContext__({...this.props.__contexes__, ...this.props.hoc})
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.__hocShouldUpdateFn__) {
      const hocShould = this.props.__hocShouldUpdateFn__(nextProps.hoc)
      if (typeof hocShould === 'boolean') return hocShould
    }

    if (this.props.__shouldUpdatFns__) {
      return reduceContextShouldUpdateFns(this.props.__shouldUpdatFns__, nextProps.__contexes__)
    }

    return true
  }

  render = () => null
}

class ContextElevatorOwner extends Component {
  shouldComponentUpdate = () => false
  render = () => <Fragment>{this.props.children}</Fragment>
}

const cleanProps = (props) => {
  const cleanProps = {...props}
  delete cleanProps.__elevateContext__
  delete cleanProps.__context__
  return cleanProps
}

const reduceShouldUpdateFns = (list, nextProps, nextState) => {
  if (list.length === 0) return true
  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  const returned = fn(nextProps, filterStateByScope(scope, nextState))
  if (typeof returned === 'boolean') return returned
  return reduceShouldUpdateFns(restFn, nextProps, nextState)
}

class CorrectMountingCycle extends Component {
  state = {}
  static getDerivedStateFromProps(props) {
    return props.state
  }

  componentDidMount() {
    const {lifeCycles} = this.props
    lifeCycles.didMount.forEach(([type, fn]) => {
      fn()
    })
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return null
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {lifeCycles} = this.props
    lifeCycles.didUpdate.forEach(([scope, fn]) => {
      fn(prevProps.Props, filterStateByScope(scope, prevState), snapshot)
    })
  }

  componentWillUnmount() {
    const {lifeCycles} = this.props
    lifeCycles.willUnmount.forEach(([_, fn]) => {
      fn()
    })
  }

  render() {
    const Render = this.props.render
    return (
      <Render {...this.props.props} />
    )
  }
}

// TODO: missing Use context
export default function makeStatefull(statelessComponent) {

  const name = statelessComponent.name
  const className = name.charAt(0).toUpperCase() + name.slice(1)

  class Statefull extends Component {
    constructor(props) {
      super()
      this.stateNameTracker = new NameTracker('state')
      this.lifeNameTracker = new NameTracker('lifecycle scope')
      this.contextNameTracker = new NameTracker('context')

      this.stateInitialized = false
      this.settableLifecycle = true

      this.initialized = false
      this.contexes = []
      this.state = {}
      this.ons = {}
      this.hoc = null
      this.ToRender = () => null
      this.isHoc = false

      this.lifeCycles = {
        didMount: [],
        didUpdate: [],
        shouldUpdate: [],
        willUnmount: [],
      }

      this.RenderComp = statelessComponent({
        makeState: this.makeState,
        getProps: this.getProps(props),
        on: this.makeOn('default'),
        addContext: this.addContext,
        setHOC: this.setHOC,
        statefullProvider: this.statefullProvider(props),
        getFullState: this.getFullState,
        getFullProps: this.getFullProps(props)
      })

      this.RenderComp.displayName = className + '-Stateless'

      let ElevatorChain = ContextElevator
      if (this.contexes.length > 0) ElevatorChain = buildContextChain(this.contexes, ElevatorChain)
      if (this.hoc) {
        const HOCElevator = (CurrentElevator) => (props) => {
          const Comp = CurrentElevator || ContextElevator
          return <Comp {...props} __hocShouldUpdateFn__={this.hoc[1]} />
        }
        ElevatorChain = this.hoc[0](HOCElevator(ElevatorChain))
      }

      this.ElevatorChain = (props) => {
        return (
          <ContextElevatorOwner>
            <ElevatorChain {...props}/>
          </ContextElevatorOwner>
        )
      }

      if (this.contexes.length === 0 && !this.hoc) {
        this.ElevatorChain = () => null
        this.initialized = true
        this.ToRender = (props) => {
          return (
            <CorrectMountingCycle
              lifeCycles={this.lifeCycles}
              props={props}
              state={this.state}
              render={this.RenderComp}
            />
          )
        }
      }
    }

    setHOC = (hoc, shouldUpdateFn) => this.hoc = [hoc, shouldUpdateFn]
    isHoc = () => this.isHoc = true

    getFullState = () => this.state

    static displayName = className + '-Statefull'

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

    /*
    * NOTE: Some where this.context gets overwridden, so we use
    *  this._context
    */
    addContext = (name, context) => {
      this.contextNameTracker.add(name)
      this.contexes.push([name, context])
    }

    // * all states are set with makeState
    // initState(newState) {
    //   initState(this)(newState)
    //   this.initState = () => {}
    // }

    getState = () => this.state
    getProps = (initProps) => () => cleanProps(this.props || initProps)
    getFullProps = (initProps) => () => this.props || initProps
    // TODO: Add context Renderer functionality linked to the Elevator
    render() {
      const { ToRender, ElevatorChain} = this
      const {__elevateContext__} = this.props
      const props = cleanProps(this.props)

      return (
        <Fragment>
          <ElevatorChain {...props} __elevateContext__={__elevateContext__}/>
          <ToRender {...props} />
        </Fragment>
      )
    }

    componentDidMount() {
      if (!this.initialized) {
        this.ToRender = (props) => {
          return (
            <CorrectMountingCycle
              lifeCycles={this.lifeCycles}
              props={cleanProps(this.props)}
              state={this.state}
              render={this.RenderComp}
            />
          )
        }
      }
      this.addContext = () => {}
      this.settableLifecycle = false
      this.ons.default.lock()
    }

    // FIXME: ShouldUpdate should skip the first round
    shouldComponentUpdate(nextProps, nextState) {
      if (!this.initialized) {
        this.initialized = true
        return true
      }
      return reduceShouldUpdateFns(this.lifeCycles.shouldUpdate, nextProps, nextState)
    }

    componentWillUnmount() {
      this.lifeCycles.willUnmount.forEach(([_, fn]) => {
        fn()
      })
    }
  }

  class ContextProvider extends Component {
    state = {}
    elevated = false

    __elevateContext__ = (contextProps) => {
      this.setState(contextProps)
    }

    render() {
      return (
        <Statefull
          {...this.props}
          {...this.state}
          __context__={this.props.__context__ || this.state}
          __elevateContext__={this.props.__elevateContext__ || this.__elevateContext__}
        />
      )
    }
  }
  return ContextProvider
}
