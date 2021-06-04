/* eslint-disable react/jsx-tag-spacing */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-return-assign */
/* eslint-disable block-spacing */
/* eslint-disable comma-dangle */

import React, {Component} from 'react'

const reduceContextShouldUpdateFns = (list, nextContextProps, contextProps) => {
  if (list.length === 0) return true
  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  if (nextContextProps[scope] === contextProps[scope] || !fn) {
    return reduceContextShouldUpdateFns(restFn, nextContextProps, contextProps)
  }

  const returned = fn(nextContextProps[scope])
  if (typeof returned === 'boolean') return returned
  return reduceContextShouldUpdateFns(restFn, nextContextProps, contextProps)
}

export default class ContextOwner extends Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.props !== this.props.props) return true

    if (this.props.shouldUpdatFns && this.props.shouldUpdatFns.length > 0) {
      return reduceContextShouldUpdateFns(this.props.shouldUpdatFns, nextProps.context, this.props.context)
    }
    return true
  }

  render = () => {
    const Render = this.props.render
    return <Render {...this.props.props} {...this.props.context} {...this.props.others} />
  }
}
