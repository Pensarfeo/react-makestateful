# react-makestateful

> MakeStateful Its an "HOC" allows you to write functional components with ALL the functionalities of class Components without using hooks. *

[![NPM](https://img.shields.io/npm/v/react-makestateful.svg)](https://www.npmjs.com/package/react-makestateful) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-makestateful
```
or

```bash
yarn add react-makestateful
```


## Usage

```jsx
import makeStatefu from 'react-makestateful'


const increaseByOneOnClick = ({makeState, getProps, addContext, setHoc, on, setGetDerivedState, statefulProvider}) => {
  // this needs to go first!
  addContext('style', ContextProvider, shouldUpdateifContextChange1)
  addContext('style2', ContextProvider2, shouldUpdateifContextChange2)

  //=> ATTENTION, props from HOC are not available in the construct phase!
  setHoc((comp) => myGoodOldHoc(comp)) 

  // Behaves similar to use state
  const [getNumber, setNumber] = makeState('number')(0)

  // getProps returns the props at the give stage of the execution, here you will print the initial props
  console.log('initial props =>' getProps() )

  // on.<lifeCycleMethod> is a setter that adds the function to the lifecycle
  on.didUpdate = (prevProps, scopedPrevState, snapshot) => {
    console.log('did Something at every update')
  }

  // --
  const onClick = () => {
    console.log('current number:', getNumber())
    setNumber(getNumber() + 1)
  }

  // add static getDerivedStateFrom(Props/Errors)
  setGetDerivedState.fromProps = (props, state) => console.log('this function will be set as the static getDerivedStateFromProps')
  setGetDerivedState.fromErrors = (error) => {console.log('this function will be set as the static getDerivedStateFromProps')}

  // add some extra functionality like you would do with hooks
  // stateful provider provides a scope to the state and lifecycle access of logic providers

  const [getVal, setVal, onWhatever] = myLogicProvider(statefulProvider('logic1'))
  const [getStuff, setStuff, onWhateverElse] = otherLogicProvider(statefulProvider('greatLogic'))
  
  // this is the function you will actually render no props will be provided, use getProps instead
  return () => {
    return(
      <div>
        <div style={getProps().style2.propShowStyle}> {JSON.stringify(getProps())}<div>
        <button onClick={onClick}> increase by 1 </button>
        <div> current Count : {getNumber()}</div>
      </div>
    )
  }
}

```

## Basics

The basic component that should be passed to ```makeStateful``` is a function that returns the component you actually want to render. Everything else before that will be executed only once (like the class constructor) when the component is instantiated. 

## Why

Mostly because hooks are bad because:
1. Black magic
2. not easy to read
3. lack the very clear lifecycle functionalities of class components
4. you need to use stuff life useRef or useMemo to avoid costly function calls that are totally avoidable if using classed

Good because
1. Let you write less code
2. Make Isolating logic easier

This package tries to fix that, to bring all the functionalities of class components to functional ones. The goal of this package is to allow people to write functional components with less black magic that have all the advantages of classes, and the compactness of hooks.

## State

You can create a state member by using makeState. Make state will return a getter and setter function for your state entry. Make function requires a name and a value. If no name is passed the name will be set as ```"default"```.
Notes:

- *The name of the state needs to be unique*

### Syntax

```js
  [stateGetter, stateSetter] = makeState(name)(value)
```

- **name (String)**: a unique name within your component. If not defined it will default to 'default'
- **value**: the initial state value
- **stateGetter (function)**: a function that returns the current value of your state
- **stateSetter (function)**: a function to set the state

### State - Setter

The state setter calls can be used in the same way as react's setState

```js
  stateSetter(updater, [callback]) 
``` 

- **updater (any)**: if the update is a function it will be called as ```updater(stae)```

The only difference with react setState is that the updater will be already wrapped in a function call when calling react's setState

## Props

The props are accessible through the ```getProps()``` method. When called within the component setup it will return the initial props. Calls within the render component will return the props at the specific render time.

### Caveats

There are 2 main caveats when calling ```getProps()``` during set up:

- getProps will have access to context props **ONLY AFTER** addContext has been called
- getProps will **NOT** return props from HOC's during setup

## Context

You can add a context consumer by calling ```addContext```

### Syntax

```js
  addContext(name, contextProvider, shouldUpdateForContext)
```

- **name (string)**: a require and unique string name
- **contextProvider (React.createContext)**
- **shouldUpdate (function)**: a function that will be called ONLY the context value of this specific context has changed. This function will not be called if the props have changed.

### shouldUpdate

the signature of this function is:
```js
(nextContext, currentContext) => boolean

```

Caveats:
- If nothing is returned we will try to re render the component will try to render by default

## HOC

You can add further logic written as HOCs

### Syntax
```js
  setHoc((comp) => yourFavoriteHOC(comp))
```

Caveats:
- The HOC functionality will not be called until AFTER the component setup face, so don't expect to have access to any props that might come from HOC. EX: If your hoc pass a prop called *banana*, calling `getProps().banana` during the component setup will return ```undefined```.

### Adding lifecycle methods
Makes stateful allows you to access ALL the lifecycle methods of React Class Components.
To add any of the available lifecycle methods in react you need to call ```on.<lifecyclemethod>```. Attention, I removed the word 'component' from lifecycle methods since it's superfluous.

### Syntax
```js
  on.shouldUpdate = Your_shouldUpdate_function
  on.getSnapshotBeforeUpdate = Your_getSnapshotBeforeUpdate_function
  on.didMount = Your_didMount_function
  on.didUpdate = Your_didUpdate_function
  on.willUnmount = Your_willUnmount_function
  on.didCatch = Your_didCatch_function
```

### Implementation Quirks
To improve readability and reduce parentesys, the behavior of ```on.<lifecyclemethod>``` does not set your method, but rather adds it to a list of methods to be executed during the specific lifecycle method. For example:

```js
  on.didMount = () => console.log('this will execute first on did mount')
  on.didMount = () => console.log('this will execute second on did mount')
  on.didMount = () => console.log('this will execute third on did mount')
```

The call other is guaranteed to be the same as the other in which the function were added.

### Should Component Update

By default ```shouldComponentUpdate``` returns true. If you add several callbacks to be called on ```shouldComponentUpdate```, the first one to return a boolean will the return value of  ```shouldComponentUpdate```. Example:

```js
  // nextProps = {num: 1}
  on.shouldUpdate = (nextProps, nextState, snapshot) => {
    console.log('You will see this log')
    if nextProps.num ===100 return false
  }
  on.shouldUpdate = (nextProps, nextState, snapshot) => {
    console.log('You will see this log')
    if nextProps.num > 0 return nextProps.num > 5
  }

  on.shouldUpdate = (nextProps, nextState, snapshot) => {
    console.log('You will not see this log unless num becomes smaller than 0')
    if nextProps.num > 0 return nextProps.num > 5
  
  }
```

## setGetDerivedState

To set ```static getDerivedStateFromProps``` and ```static getDerivedStateFromError``` you can call the setters: ```setGetDerivedState.fromProps``` and ```setGetDerivedState.fromError``` respectively.

### Syntax

```js
  setGetDerivedState.fromProps = yourGetDerivedStateFromProps
  setGetDerivedState.fromErrors = yourGetDerivedStateFromError

```

## Isolating logic

Just like hooks it is super easy to add external logic. Moreover, in order to isolate the access to state, you can (but you don't have to) scope lifecycle methods and makeState. This will not only remove possible conflicts when setting state, but will also limit the access to the full state from logic providers during the calls to ```getSnapshotBeforeUpdate```, ```componentDidUpdate```, and ```shouldComponentUpdate```. Within your logic provider you can use ```makeState```, and the ```on``` setters just like you would have done if you had a regular component. 

### Syntax
```js
  {makeState, getProps, addContext, on} = statefulProvider(name)
```

## Passing refs

if you set a ref on the component you will simply not receive it. If you want to pass a ref just use a props name other than "ref". For example

```jsx
  <MyMakeStatefullComponet ref={myRef}>
```

will not pass the reff sot that ```getPros().ref``` will return ```undefined```, instead

```jsx
  <MyMakeStatefullComponet toPassRef={myRef}>
```

will give you access to ```toPassRef``` so that ```getProps().toPassRef``` will return ```myRef```

## Other methods

- ```getFullState``` will return the full state

## Missing

The only thing missing is the implementation of the static method displayName and defaultProps:
- ```defaultProps``` can be trivially implemented in your component
- ```displayName``` was just not worth implementing for my need

## Contributing

YES PLEASE! :)

## License

MIT © [pensarfeo](https://github.com/pensarfeo)

