/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */
import React, {Component} from 'react'
import {buildStateful, Stateful} from './stateful'
import initializeStatelessComponent from './initState'
import buildContextChain from './contextChain'

// TODO: missing Use context
export default function makeStatefull(statelessComponent) {
  const name = statelessComponent.name
  const className = name.charAt(0).toUpperCase() + name.slice(1)
  class StateOwner extends Component {

    constructor(props) {
      super()

      this.contexes = []
      this.state = {}
      this.elevated = false
      this.Render = () => null

      const statelesInit = initializeStatelessComponent.call({}, props, statelessComponent, className)
      const {getDerivedStateFromProps, getDerivedStateFromError} = statelesInit

      let StatefulComponent = Stateful
      if (getDerivedStateFromProps || getDerivedStateFromError) {
        StatefulComponent = buildStateful(getDerivedStateFromProps, getDerivedStateFromError)
      }

      const Render = (props) => <StatefulComponent {...props} _stateless_={statelesInit}/>

      const ElevatorChain = buildContextChain(Render, statelesInit.contexes, statelesInit.hoc)
      this.Render = (props) => <ElevatorChain props={props} />
      // contexes={statelesInit.contexes}
    }

    static displayName = className + '-Statefull'

    render() {
      const {Render} = this
      return <Render {...this.props}/>
    }
  }
  return StateOwner
}
