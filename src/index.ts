/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  Signal
} from 'phosphor-signaling';


/**
 * The args object emitted with the change notification signal.
 */
export
interface IChangedArgs<T> {
  /**
   * The name of the property which was changed.
   */
  name: string;

  /**
   * The old value of the property.
   */
  oldValue: T;

  /**
   * The new value of the property.
   */
  newValue: T;
}


/**
 * The options object used to initialize a property descriptor.
 */
export
interface IPropertyOptions<T, U> {
  /**
   * The human readable name for the property.
   *
   * #### Notes
   * By convention, this should be the same as the name used to define
   * the public accessor for the property value.
   *
   * This **does not** have an effect on the property lookup behavior,
   * and multiple properties may share the same name without conflict.
   */
  name: string;

  /**
   * The default value for the property.
   *
   * #### Notes
   * This value will be shared among all property owner instances. It
   * should be an immutable value unless a mutable shared singleton
   * is explicitly desired.
   *
   * If this is not provided, it defaults to `undefined`.
   */
  value?: U;

  /**
   * A factory function used to create the default property value.
   *
   * #### Notes
   * If provided, this takes precedence over the [[value]] option.
   *
   * This will be called whenever the property value is required,
   * but has not yet been set for a given owner.
   */
  create?: (owner: T) => U;

  /**
   * A function used to coerce a supplied value into the final value.
   *
   * #### Notes
   * This will be called whenever the property value is changed, or
   * when the property is explicitly coerced. The return value will
   * be used as the final value of the property.
   *
   * This will **not** be called for the initial default value.
   */
  coerce?: (owner: T, value: U) => U;

  /**
   * A function used to compare two values for equality.
   *
   * #### Notes
   * This is called to determine if the property value has changed.
   * It should return `true` if the given values are equivalent, or
   * `false` if they are different.
   *
   * If this is not provided, the comparison uses the `===` operator.
   */
  compare?: (oldValue: U, newValue: U) => boolean;

  /**
   * A function called when the property value has changed.
   *
   * #### Notes
   * This will be invoked when the property value is changed and the
   * comparitor indicates that the old value is not equal to the new
   * value.
   *
   * This will **not** be called for the initial default value.
   *
   * This will be invoked **before** the notify signal is emitted.
   */
  changed?: (owner: T, oldValue: U, newValue: U) => void;

  /**
   * A signal emitted when the property value has changed.
   *
   * #### Notes
   * This will be bound and emitted on behalf of the owner when the
   * property is changed and the comparitor indicates that the old
   * value is not equal to the new value.
   *
   * This will **not** be emitted for the initial default value.
   *
   * This will be emitted **after** the changed callback is invoked.
   */
  notify?: Signal<T, IChangedArgs<U>>;
}


/**
 * A property descriptor for a property on an object.
 *
 * Properties descriptors can be used to expose a rich interface for an
 * object which encapsulates value creation, coercion, and notification.
 *
 * They can also be used to extend the state of an object with semantic
 * data from another class.
 *
 * #### Example
 * ```typescript
 * import { IChangedArgs, Property } from 'phosphor-properties';
 *
 * import { ISignal, Signal } from 'phosphor-signaling';
 *
 * class MyClass {
 *
 *   static stateChangedSignal = new Signal<MyClass, IChangedArgs<any>>();
 *
 *   static valueProperty = new Property<MyClass, number>({
 *      name: 'value',
 *      value: 0,
 *      coerce: (owner, value) => Math.max(0, value),
 *      changed: (owner, oldValue, newValue) => { console.log(newValue); },
 *      notify: MyClass.stateChangedSignal,
 *   });
 *
 *   static textProperty = new Property<MyClass, number>({
 *      name: 'text',
 *      value: '',
 *      coerce: (owner, value) => value.toLowerCase(),
 *      changed: (owner, oldValue, newValue) => { console.log(newValue); },
 *      notify: MyClass.stateChangedSignal,
 *   });
 *
 *   get stateChanged(): ISignal<MyClass, IChangedArgs<any>> {
 *     return MyClass.stateChangedSignal.bind(this);
 *   }
 *
 *   get value(): number {
 *     return MyClass.valueProperty.get(this);
 *   }
 *
 *   set value(value: number) {
 *     MyClass.valueProperty.set(this, value);
 *   }
 *
 *   get text(): string {
 *     return MyClass.textProperty.get(this);
 *   }
 *
 *   set text(value: string) {
 *     MyClass.textProperty.set(this, value);
 *   }
 * }
 * ```
 */
export
class Property<T, U> {
  /**
   * Construct a new property descriptor.
   *
   * @param options - The options for initializing the property.
   */
  constructor(options: IPropertyOptions<T, U>) {
    this._name = options.name;
    this._value = options.value;
    this._create = options.create;
    this._coerce = options.coerce;
    this._compare = options.compare;
    this._changed = options.changed;
    this._notify = options.notify;
  }

  /**
   * Get the human readable name for the property.
   *
   * #### Notes
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
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
    let value: U;
    let hash = lookupHash(owner);
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
   * If the value has not yet been set, the default value will be
   * computed and used as the previous value for the comparison.
   */
  set(owner: T, value: U): void {
    let oldValue: U;
    let hash = lookupHash(owner);
    if (this._pid in hash) {
      oldValue = hash[this._pid];
    } else {
      oldValue = hash[this._pid] = this._createValue(owner);
    }
    let newValue = this._coerceValue(owner, value);
    this._maybeNotify(owner, oldValue, hash[this._pid] = newValue);
  }

  /**
   * Explicitly coerce the current property value for a given owner.
   *
   * @param owner - The property owner of interest.
   *
   * #### Notes
   * If the value has not yet been set, the default value will be
   * computed and used as the previous value for the comparison.
   */
  coerce(owner: T): void {
    let oldValue: U;
    let hash = lookupHash(owner);
    if (this._pid in hash) {
      oldValue = hash[this._pid];
    } else {
      oldValue = hash[this._pid] = this._createValue(owner);
    }
    let newValue = this._coerceValue(owner, oldValue);
    this._maybeNotify(owner, oldValue, hash[this._pid] = newValue);
  }

  /**
   * Get or create the default value for the given owner.
   */
  private _createValue(owner: T): U {
    let create = this._create;
    return create ? create(owner) : this._value;
  }

  /**
   * Coerce the value for the given owner.
   */
  private _coerceValue(owner: T, value: U): U {
    let coerce = this._coerce;
    return coerce ? coerce(owner, value) : value;
  }

  /**
   * Compare the old value and new value for equality.
   */
  private _compareValue(oldValue: U, newValue: U): boolean {
    let compare = this._compare;
    return compare ? compare(oldValue, newValue) : oldValue === newValue;
  }

  /**
   * Run the change notification if the given values are different.
   */
  private _maybeNotify(owner: T, oldValue: U, newValue: U): void {
    let changed = this._changed;
    let notify = this._notify;
    if (!changed && !notify) {
      return;
    }
    if (this._compareValue(oldValue, newValue)) {
      return;
    }
    if (changed) {
      changed(owner, oldValue, newValue);
    }
    if (notify) {
      notify.bind(owner).emit({ name: this._name, oldValue, newValue });
    }
  }

  private _value: U;
  private _name: string;
  private _pid = nextPID();
  private _create: (owner: T) => U;
  private _coerce: (owner: T, value: U) => U;
  private _notify: Signal<T, IChangedArgs<U>>;
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
 * **not** run the change notification for any of the properties.
 */
export
function clearPropertyData(owner: any): void {
  ownerData.delete(owner);
}


/**
 * A typedef for a hash mapping of property id to property value.
 */
type PropertyHash = { [key: string]: any };


/**
 * A weak mapping of property owner to property hash.
 */
var ownerData = new WeakMap<any, PropertyHash>();


/**
 * A function which computes successive unique property ids.
 */
var nextPID = (() => { let id = 0; return () => 'pid-' + id++; })();


/**
 * Lookup the data hash for the property owner.
 *
 * This will create the hash if one does not already exist.
 */
function lookupHash(owner: any): PropertyHash {
  let hash = ownerData.get(owner);
  if (hash !== void 0) return hash;
  hash = Object.create(null);
  ownerData.set(owner, hash);
  return hash;
}
