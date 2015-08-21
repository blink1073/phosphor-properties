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
subsequent section for examples of recommended design patterns.

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

**Recommended Design Patterns:**

Class authors should strive to maintain consistency in how classes expose
their properties to consumers. The PhosphorJS project has adopted Property
conventions which cover naming and behavior. It is suggested that third
party libraries adopt these same conventions to ensure API consistency
and maximal compatibility with libraries which rely on convention.

```typescript
/**
 * When defining a property for use by instances of **the same class:**:
 *
 *   - Define the property as a static member of the class.
 *
 *   - Ensure the class type is used as the property owner type.
 *
 *   - Append the suffix 'Property' to the static member name.
 *
 *   - Define a public getter/setter which delegates access to the
 *     static property. The getter/setter should not perform extra
 *     logic outside of delegation to the static property.
 *
 *   - The name of the getter/setter should be the same as the name
 *     of the static property minus the 'Property' suffix.
 *
 *   - Consumers should normally use the getter/setter to access the
 *     property, but meta tools and code generators are free to use
 *     the property API directly. This is why the getter/setter must
 *     be a pure delegate as described above.
 */
class MyObject implements IPropertyOwner {

  static valueProperty = new Property<MyObject, number>({
    value: 42,
    changed: onValueChanged,
  });

  @defineSignal
  propertyChanged: ISignal<IPropertyChangedArgs>;

  get value(): number {
    return MyObject.valueProperty.get(this);
  }

  set value(value: number) {
    MyObject.valueProperty.set(this, value);
  }
}


function onValueChanged(owner: MyObject, oldValue: number, newValue: number): void {
  // Handle the value change. Module-private functions can be considered
  // "friend" functions of the owner object, and casting it to <any> in
  // order to call private or protected methods is a valid pattern.
}


var obj = new MyObject();
obj.value;       // 42
obj.value = 17;  //
obj.value;       // 17


/**
 * When defining a property for use by instances of **a different class:**:
 *
 *   - Define the property as a static member of the class.
 *
 *   - Ensure the instance type is used as the property owner type.
 *
 *   - Append the suffix 'Property' to the static member name.
 *
 *   - Define static methods to get and set the value of the property
 *     for a particular instance of the owner type. These two methods
 *     should not perform extra logic outside of delegation to the
 *     static property.
 *
 *   - Name the static methods by prepending 'get' and 'set' to the
 *     capitalized property name. Omit the 'Property' suffix.
 *
 *   - Consumers should normally use the static methods to access the
 *     property, but meta tools and code generators are free to use
 *     the property API directly. This is why the methods must be
 *     pure delegates as described above.
 *
 * This pattern is commonly referred to as an "attached property". The
 * behavioral semantics of the property belong to one class, but the
 * property data belongs to a foreign instance. This pattern is useful
 * when creating container objects which must associate container data
 * with child objects in a way which doesn't require poluting the child
 * class with extraneous data members.
 */
class MyWidget implements IPropertyOwner {

  @defineSignal
  propertyChanged: ISignal<IPropertyChangedArgs>;
}


class MyContainer {

  static stretchProperty = new Property<MyWidget, number>({
    value: 0,
    coerce: (owner, value) => Math.max(0, value),
  });

  static getStretch(widget: MyWidget): number {
    return MyContainer.stretchProperty.get(widget);
  }

  static setStretch(widget: MyWidget, value: number): void {
    MyContainer.stretchProperty.set(widget, value);
  }

  addWidget(widget: MyWidget): void {
  	this._addWidget(widget);
  	widget.propertyChanged.connect(this._onWidgetChanged, this);
  }

  private _addWidget(widget: MyWidget): void {
  	var stretch = MyContainer.getStretch(widget);
  	this._widgets.push(widget);
  	// update layout with the stretch factor
  }

  private _onWidgetChanged(args: IPropertyChangedArgs): void {
  	if (args.property === MyContainer.stretchProperty) {
  	  var widget = <MyWidget>emitter();
  	  var stretch = <number>args.newValue;
  	  // update layout with the stretch factor
  	}
  }

  private _widgets: MyWidget[] = [];
}


var widget = new MyWidget();
MyContainer.setStretch(widget, 3);

var container = new MyContainer();
container.addWidget(widget);
```
