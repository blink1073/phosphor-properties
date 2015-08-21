phosphor-properties
===================

A module for attached property descriptors.

[API Docs](http://phosphorjs.github.io/phosphor-properties/)


Package Install
---------------

**Prerequisites**
- [node](http://nodejs.org/)

```bash
npm install --save phosphor-properties
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org/)

```bash
git clone https://github.com/phosphorjs/phosphor-properties.git
cd phosphor-properties
npm install
```

**Rebuild**
```bash
npm run clean
npm run build
```


Run Tests
---------

Follow the source build instructions first.

```bash
npm test
```


Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`.


Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- Node 0.12.7+
- IE 11+
- Firefox 32+
- Chrome 38+


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simply
omit the type declarations when using a language other than TypeScript.

**Raw API:**
Consumers of a class will not typically interact with properties directly.
The following examples demonstrate the Property API which will be used by
class authors. Most classes will encapsulate property access for the user
by exposing the properties as getters/setters or static methods. See the
subsequent sections for examples of recommended design patterns.

```typescript
import { IPropertyChangedArgs, IPropertyOwner, Property } from 'phosphor-properties';

import { ISignal, defineSignal } from 'phosphor-signaling';


// Any object can be used as a model, provided it implements `IPropertyOwner`.
class Model implements IPropertyOwner {
  /**
   * A signal emitted automatically when a property is changed.
   */
  @defineSignal
  propertyChanged: ISignal<IPropertyChangedArgs>;
}

var model1 = new Model();
var model2 = new Model();


// simple number property
var valueProperty = new Property<Model, number>({
  value: 42,
});
valueProperty.get(model1);      // 42
valueProperty.set(model1, 84);  //
valueProperty.get(model1);      // 84
valueProperty.get(model2);      // 42


// default value factory
var listProperty = new Property<Model, number[]>({
  create: model => [1, 2, 3],
});
var l1 = listProperty.get(model1);  // [1, 2, 3]
var l2 = listProperty.get(model2);  // [1, 2, 3]
l1 === l2;                          // false


// coerce value callback
var minValue = 0;
var limitProperty = new Property<Model, number>({
  value: 0,
  coerce: (model, value) => Math.max(minValue, value),
});
limitProperty.set(model1, -10);  //
limitProperty.get(model1);       // 0
limitProperty.set(model1, 42);   //
limitProperty.get(model1);       // 42
minValue = 100;                  //
limitProperty.coerce(model1);    //
limitProperty.get(model1);       // 100


// value changed callback
var loggingProperty = new Property<Model, number>({
  value: 0,
  changed: (model, oldValue, newValue) => {
    console.log('changed:', oldValue, newValue);
  },
});
loggingProperty.set(model1, 10);  // changed: 0 10
loggingProperty.set(model1, 42);  // changed: 10 42


// compare values callback (assume a `deepEqual` function exists)
var objectProperty = new Property<Model, any>({
  compare: (oldValue, newValue) => deepEqual(oldValue, newValue),
  changed: (model, oldValue, newValue) => {
    console.log('changed:', oldValue, newValue);
  },
});
loggingProperty.set(model1, { a: 1, b: 2 });  // changed: undefined { a: 1, b: 2 }
loggingProperty.set(model1, { a: 1, b: 2 });  //
loggingProperty.set(model1, [1, 2, 3]);       // changed: { a: 1, b: 2 } [1, 2, 3]
loggingProperty.set(model1, [1, 2, 3]);       //
loggingProperty.set(model1, void 0);          // changed: [1, 2, 3] undefined


// `propertyChanged` signal
model1.propertyChanged.connect(args => {
  if (args.property === valueProperty) {
    console.log('value changed:', args.oldValue, args.newValue);
  }
});
valueProperty.set(model1, 0);  // value changed: 84 0
```
