/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import { ISignal } from 'phosphor-signaling';


/**
 * The arguments object emitted with a [[propertyChanged]] signal.
 */
export
interface IPropertyChangedArgs {
  /**
   * The property descriptor associated with the change.
   */
  property: Property<any, any>;

  /**
   * The old value of the property.
   */
  oldValue: any;

  /**
   * The new value of the property.
   */
  newValue: any;
}


/**
 * An object which can be used with the property descriptors.
 *
 * #### Notes
 * Any object can be used with property descriptors, provided that the
 * object has a [[propertyChanged]] signal. The signal will be emitted
 * automatically by the property descriptor when the value is changed.
 */
export
interface IPropertyOwner {
  /**
   * A signal emitted when the value of a property changes.
   */
  propertyChanged: ISignal<IPropertyChangedArgs>;
}


/**
 * The options object used to initialize a property descriptor.
 */
export
interface IPropertyOptions<T, U> {
  /**
   * The default value for the property.
   *
   * #### Notes
   * This value will be shared among all property owner instances. It
   * should be an immutable value unless a mutable shared singleton
   * is explicitly desired.
   */
  value?: U;

  /**
   * A factory function used to create the default property value.
   *
   * If provided, this takes precedence over the [[value]] option.
   * It will be called whenever the property value is required,
   * but has not yet been set.
   */
  create?: (owner: T) => U;

  /**
   * A function used to coerce a supplied value into the final value.
   *
   * This will be called whenever the property value is changed, or
   * when the property is explicitly coerced. The return value will
   * be used as the final value of the property.
   *
   * #### Notes
   * This will **not** be called for the initial default value.
   */
  coerce?: (owner: T, value: U) => U;

  /**
   * A function used to compare two values for inequality.
   *
   * This is called to determine if the property value has changed.
   * It should return `true` if the given values are different, or
   * `false` if they are equivalent.
   *
   * #### Notes
   * If this is not provided, the comparison uses the `!==` operator.
   */
  compare?: (oldValue: U, newValue: U) => boolean;

  /**
   * A function called when the property value has changed.
   *
   * This will be invoked when the property value is changed and the
   * comparitor indicates that the old value is not equal to the new
   * value.
   *
   * #### Notes
   * This will **not** be called for the initial default value.
   *
   * This will be invoked **before** the [[propertyChanged]] signal
   * is emitted on the property owner.
   */
  changed?: (owner: T, oldValue: U, newValue: U) => void;
}


/**
 * A property descriptor for a property on an object.
 *
 * Properties descriptors can be used to expose a rich interface for an
 * object which encapsulates value creation, coercion, and notification.
 * They can also be used to extend the state of an object with semantic
 * data from another class.
 *
 * #### Example
 * ```typescript
 * import { ISignal, defineSignal } from 'phosphor-signaling';
 * import { IPropertyChangedArgs, Property } from 'phosphor-properties';
 *
 * class MyClass {
 *
 *   static myValueProperty = new Property<MyClass, number>({
 *      value: 0,
 *      coerce: (owner, value) => Math.max(0, value),
 *      changed: (owner, oldValue, newValue) => { console.log(newValue); },
 *   });
 *
 *   @defineSignal
 *   propertyChanged: ISignal<IPropertyChangedArgs>;
 *
 *   get myValue(): number {
 *     return MyClass.myValueProperty.get(this);
 *   }
 *
 *   set myValue(value: number) {
 *     MyClass.myValueProperty.set(this, value);
 *   }
 * }
 * ```
 */
export
class Property<T extends IPropertyOwner, U> {
  /**
   * Construct a new property descriptor.
   *
   * @param options - The options for initializing the property.
   */
  constructor(options: IPropertyOptions<T, U> = {}) {
    this._value = options.value;
    this._create = options.create;
    this._coerce = options.coerce;
    this._compare = options.compare;
    this._changed = options.changed;
  }

  /**
   * Get the current value of the property for a given owner.
   *
   * @param owner - The property owner of interest.
   *
   * @returns The current value of the property.
   *
   * #### Notes
   * If the value has not yet been set, the default value will be
   * computed and assigned as the current value of the property.
   */
  get(owner: T): U {
    var value: U;
    var hash = lookupHash(owner);
    if (this._pid in hash) {
      value = hash[this._pid];
    } else {
      value = hash[this._pid] = this._createValue(owner);
    }
    return value;
  }

  /**
   * Set the current value of the property for a given owner.
   *
   * @param owner - The property owner of interest.
   *
   * @param value - The value for the property.
   *
   * #### Notes
   * If this operation causes the property value to change, the
   * `propertyChanged` signal of the owner will be emitted.
   *
   * If the value has not yet been set, the default value will be
   * computed and used as the previous value for the comparison.
   */
  set(owner: T, value: U): void {
    var oldValue: U;
    var hash = lookupHash(owner);
    if (this._pid in hash) {
      oldValue = hash[this._pid];
    } else {
      oldValue = this._createValue(owner);
    }
    var newValue = hash[this._pid] = this._coerceValue(owner, value);
    this._notifyIfChanged(owner, oldValue, newValue);
  }

  /**
   * Explicitly coerce the current property value for a given owner.
   *
   * @param owner - The property owner of interest.
   *
   * #### Notes
   * If this operation causes the property value to change, the
   * `propertyChanged` signal of the owner will be emitted.
   *
   * If the value has not yet been set, the default value will be
   * computed and used as the previous value for the comparison.
   */
  coerce(owner: T): void {
    var oldValue: U;
    var hash = lookupHash(owner);
    if (this._pid in hash) {
      oldValue = hash[this._pid];
    } else {
      oldValue = this._createValue(owner);
    }
    var newValue = hash[this._pid] = this._coerceValue(owner, oldValue);
    this._notifyIfChanged(owner, oldValue, newValue);
  }

  /**
   * Get or create the default value for the given owner.
   */
  private _createValue(owner: T): U {
    var create = this._create;
    return create ? create(owner) : this._value;
  }

  /**
   * Coerce the value for the given owner.
   */
  private _coerceValue(owner: T, value: U): U {
    var coerce = this._coerce;
    return coerce ? coerce(owner, value) : value;
  }

  /**
   * Compare the old value and new value for inequality.
   */
  private _compareValues(oldValue: U, newValue: U): boolean {
    var compare = this._compare;
    return compare ? compare(oldValue, newValue) : oldValue !== newValue;
  }

  /**
   * Run the change notification if the given values are different.
   */
  private _notifyIfChanged(owner: T, oldValue: U, newValue: U): void {
    if (!this._compareValues(oldValue, newValue)) {
      return;
    }
    var changed = this._changed;
    if (changed) changed(owner, oldValue, newValue);
    var args = { property: this, oldValue: oldValue, newValue: newValue };
    owner.propertyChanged.emit(args);
  }

  private _value: U;
  private _pid = nextPID();
  private _create: (owner: T) => U;
  private _coerce: (owner: T, value: U) => U;
  private _compare: (oldValue: U, newValue: U) => boolean;
  private _changed: (owner: T, oldValue: U, newValue: U) => void;
}


/**
 * Clear the stored property data for the given property owner.
 *
 * @param owner - The property owner of interest.
 *
 * #### Notes
 * This will clear all property values for the owner, but it will
 * **not** emit any property change notifications.
 */
export
function clearPropertyData(owner: IPropertyOwner): void {
  ownerData.delete(owner);
}


/**
 * A typedef for a hash mapping of property id to property value.
 */
type PropertyHash = { [key: string]: any };


/**
 * A weak mapping of property owner to property hash.
 */
var ownerData = new WeakMap<IPropertyOwner, PropertyHash>();


/**
 * A function which computes successive unique property ids.
 */
var nextPID = (() => { var id = 0; return () => 'pid-' + id++; })();


/**
 * Lookup the data hash for the property owner.
 *
 * This will create the hash if one does not already exist.
 */
function lookupHash(owner: IPropertyOwner): PropertyHash {
  var hash = ownerData.get(owner);
  if (hash !== void 0) return hash;
  hash = Object.create(null);
  ownerData.set(owner, hash);
  return hash;
}
