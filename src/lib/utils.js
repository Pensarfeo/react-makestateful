export const reduceContextShouldUpdateFns = (list, nextContextProps) => {
  if (list.length === 0) return true
  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  if (!fn) return reduceShouldUpdateFns(restFn, nextContextProps)
  const returned = fn(nextContextProps[scope])
  if (typeof returned === 'boolean') return returned
  return reduceContextShouldUpdateFns(restFn, nextContextProps)
}

export const reduceShouldUpdateFns = (list, nextProps, nextState) => {
  if (list.length === 0) return true
  const [scope, fn] = list[0]
  const restFn = list.slice(1)

  const returned = fn(nextProps, filterStateByScope(scope, nextState))
  if (typeof returned === 'boolean') return returned
  return reduceShouldUpdateFns(restFn, nextProps, nextState)
}

export const filterStateByScope = (scope, state) => {
  if (scope !== 'default') return state[scope]
  return state
}

export class NameTracker {
  constructor(type) {
    this.type = type
    this.names = []
  }

  add = (name) => {
    console.log(name, this.names)
    if (this.names.includes(name)) {
      throw Error(`${name} is already included in the ${this.type}, you can't add a state key more than once`)
    }
    this.names.push(name)
  }
}
