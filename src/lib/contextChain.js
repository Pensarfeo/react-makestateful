/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */
import React, {Component} from 'react'
import ContextOwner from './contextOwner'

class ContextChain extends Component {
  constructor(initProps) {
    super(initProps)
    const {contexes, render, shouldUpdatFns = []} = initProps

    if (contexes.length === 0) {
      const Render = render
      this.Render = ({props, context}) => <Render props={props} context={context} shouldUpdatFns={shouldUpdatFns} />
      return
    }

    const [name, Context, shouldUpdateFn] = contexes.slice(-1)[0]
    const remainingContexes = contexes.slice(0, -1)

    let newShouldUpdatFns = shouldUpdatFns
    if (shouldUpdateFn) newShouldUpdatFns = shouldUpdatFns.concat([[name, shouldUpdateFn]])

    this.Render = ({props, context, render}) => {
      return (
        <Context.Consumer>
          {(args) => {
            return (
              <ContextChain
                props={props}
                context={{[name]: args, ...context}}
                contexes={remainingContexes}
                render={render}
                shouldUpdatFns={newShouldUpdatFns}
              />
            )
          }}
        </Context.Consumer>
      )
    }
  }

  render() {
    const {Render} = this
    return <Render {...this.props} />
  }
}

const buildContextChain = (render, contexes, shouldUpdatFns = []) => ({props}) => {
  return (
    <ContextChain
      props={props}
      contexes={contexes}
      render={render}
      shouldUpdatFns={shouldUpdatFns}
    />
  )
}

export default (Render, contexes, hoc) => {
  let ElevatorChain = ({props, context, shouldUpdatFns, ...others}) => {
    return <ContextOwner props={props} others={others} context={context} render={Render} shouldUpdatFns={shouldUpdatFns}/>
  }
  if (contexes.length > 0) {
    ElevatorChain = buildContextChain(ElevatorChain, contexes)
  }
  if (hoc) {
    const HocElevatorChain = hoc((props) => <ElevatorChain props={props}/>)
    return ({props}) => <HocElevatorChain {...props}/>
  }
  return ElevatorChain
}
