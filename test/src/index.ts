/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import expect = require('expect.js');

import {
  IChangedArgs, Property, clearPropertyData
} from '../../lib/index';


class Model {
  dummyValue = 42;
}


describe('phosphor-properties', () => {

  describe('Property', () => {

    describe('#constructor()', () => {

      it('should accept zero arguments', () => {
        var p = new Property<Model, number>();
        expect(p instanceof Property).to.be(true);
      });

      it('should accept a single options argument', () => {
        var p = new Property<Model, number>({
          value: 12,
          create: (owner) => 42,
          coerce: (owner, value) => Math.max(0, value),
          compare: (oldValue, newValue) => oldValue === newValue,
          changed: (owner, oldValue, newValue) => { },
        });
        expect(p instanceof Property).to.be(true);
      });

    });

    describe('#metadata', () => {

      it('should default to a new empty object', () => {
        var p1 = new Property<Model, number>();
        var p2 = new Property<Model, number>();
        expect(p1.metadata).to.eql({});
        expect(p2.metadata).to.eql({});
        expect(p1.metadata).to.eql(p2.metadata);
        expect(p1.metadata).to.not.be(p2.metadata);
      });

      it('should use the metadata provided to the constructor', () => {
        var m = { one: 1, two: 2 };
        var p = new Property<Model, number>({
          metadata: m,
        });
        expect(p.metadata).to.be(m);
      });

      it('should be a read-only property', () => {
        var p = new Property<Model, number>();
        expect(() => { p.metadata = {}; }).to.throwException();
      });

    });

    describe('#get()', () => {

      it('should return the current value of the property', () => {
        var p1 = new Property<Model, number>();
        var p2 = new Property<Model, number>();
        var p3 = new Property<Model, number>();
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        expect(p1.get(m1)).to.be(void 0);
        expect(p1.get(m2)).to.be(void 0);
        expect(p1.get(m3)).to.be(void 0);
        expect(p2.get(m1)).to.be(void 0);
        expect(p2.get(m2)).to.be(void 0);
        expect(p2.get(m3)).to.be(void 0);
        expect(p3.get(m1)).to.be(void 0);
        expect(p3.get(m2)).to.be(void 0);
        expect(p3.get(m3)).to.be(void 0);
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(p1.get(m1)).to.be(1);
        expect(p1.get(m2)).to.be(2);
        expect(p1.get(m3)).to.be(3);
        expect(p2.get(m1)).to.be(4);
        expect(p2.get(m2)).to.be(5);
        expect(p2.get(m3)).to.be(6);
        expect(p3.get(m1)).to.be(7);
        expect(p3.get(m2)).to.be(8);
        expect(p3.get(m3)).to.be(9);
      });

      it('should return the default value if the value is not yet set', () => {
        var p1 = new Property<Model, number>({ value: 42 });
        var p2 = new Property<Model, number>({ value: 43 });
        var p3 = new Property<Model, number>({ value: 44 });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        expect(p1.get(m1)).to.be(42);
        expect(p2.get(m1)).to.be(43);
        expect(p3.get(m1)).to.be(44);
        expect(p1.get(m2)).to.be(42);
        expect(p2.get(m2)).to.be(43);
        expect(p3.get(m2)).to.be(44);
        expect(p1.get(m3)).to.be(42);
        expect(p2.get(m3)).to.be(43);
        expect(p3.get(m3)).to.be(44);
      });

      it('should use the default factory if the value is not yet set', () => {
        var tick = 42;
        var create = () => tick++;
        var p1 = new Property<Model, number>({ create: create });
        var p2 = new Property<Model, number>({ create: create });
        var p3 = new Property<Model, number>({ create: create });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        expect(p1.get(m1)).to.be(42);
        expect(p2.get(m1)).to.be(43);
        expect(p3.get(m1)).to.be(44);
        expect(p1.get(m2)).to.be(45);
        expect(p2.get(m2)).to.be(46);
        expect(p3.get(m2)).to.be(47);
        expect(p1.get(m3)).to.be(48);
        expect(p2.get(m3)).to.be(49);
        expect(p3.get(m3)).to.be(50);
      });

      it('should prefer the default factory over the default value', () => {
        var tick = 42;
        var create = () => tick++;
        var p1 = new Property<Model, number>({ value: 1, create: create });
        var p2 = new Property<Model, number>({ value: 1, create: create });
        var p3 = new Property<Model, number>({ value: 1, create: create });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        expect(p1.get(m1)).to.be(42);
        expect(p2.get(m1)).to.be(43);
        expect(p3.get(m1)).to.be(44);
        expect(p1.get(m2)).to.be(45);
        expect(p2.get(m2)).to.be(46);
        expect(p3.get(m2)).to.be(47);
        expect(p1.get(m3)).to.be(48);
        expect(p2.get(m3)).to.be(49);
        expect(p3.get(m3)).to.be(50);
      });

      it('should not invoke the coerce function', () => {
        var called = false;
        var coerce = (m: Model, v: number) => (called = true,  v);
        var p1 = new Property<Model, number>({ value: 1, coerce: coerce });
        var p2 = new Property<Model, number>({ value: 1, coerce: coerce });
        var p3 = new Property<Model, number>({ value: 1, coerce: coerce });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.be(false);
      });

      it('should not invoke the compare function', () => {
        var called = false;
        var compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        var p1 = new Property<Model, number>({ value: 1, compare: compare });
        var p2 = new Property<Model, number>({ value: 1, compare: compare });
        var p3 = new Property<Model, number>({ value: 1, compare: compare });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.be(false);
      });

      it('should not invoke the changed function', () => {
        var called = false;
        var changed = () => { called = true; };
        var p1 = new Property<Model, number>({ value: 1, changed: changed });
        var p2 = new Property<Model, number>({ value: 1, changed: changed });
        var p3 = new Property<Model, number>({ value: 1, changed: changed });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.be(false);
      });

      it('should not emit the `changedSignal`', () => {
        var called = false;
        var changed = () => { called = true; };
        var p1 = new Property<Model, number>({ value: 1 });
        var p2 = new Property<Model, number>({ value: 1 });
        var p3 = new Property<Model, number>({ value: 1 });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        Property.getChanged(m1).connect(changed);
        Property.getChanged(m2).connect(changed);
        Property.getChanged(m3).connect(changed);
        p1.get(m1);
        p2.get(m1);
        p3.get(m1);
        p1.get(m2);
        p2.get(m2);
        p3.get(m2);
        p1.get(m3);
        p2.get(m3);
        p3.get(m3);
        expect(called).to.be(false);
      });

    });

    describe('#set()', () => {

      it('should set the current value of the property', () => {
        var p1 = new Property<Model, number>();
        var p2 = new Property<Model, number>();
        var p3 = new Property<Model, number>();
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(p1.get(m1)).to.be(1);
        expect(p1.get(m2)).to.be(2);
        expect(p1.get(m3)).to.be(3);
        expect(p2.get(m1)).to.be(4);
        expect(p2.get(m2)).to.be(5);
        expect(p2.get(m3)).to.be(6);
        expect(p3.get(m1)).to.be(7);
        expect(p3.get(m2)).to.be(8);
        expect(p3.get(m3)).to.be(9);
      });

      it('should invoke the changed function if the value changes', () => {
        var models: Model[] = [];
        var oldvals: number[] = [];
        var newvals: number[] = [];
        var changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        var p1 = new Property<Model, number>({ value: 0, changed: changed });
        var p2 = new Property<Model, number>({ value: 0, changed: changed });
        var p3 = new Property<Model, number>({ value: 0, changed: changed });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(models).to.eql([m1, m2, m3, m1, m2, m3, m1, m2, m3]);
        expect(oldvals).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(newvals).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should emit the `changedSignal` if the value changes', () => {
        var models: Model[] = [];
        var oldvals: number[] = [];
        var newvals: number[] = [];
        var changed = (sender: Model, args: IChangedArgs) => {
          models.push(sender);
          oldvals.push(args.oldValue);
          newvals.push(args.newValue);
        };
        var p1 = new Property<Model, number>({ value: 0 });
        var p2 = new Property<Model, number>({ value: 0 });
        var p3 = new Property<Model, number>({ value: 0 });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        Property.getChanged(m1).connect(changed);
        Property.getChanged(m2).connect(changed);
        Property.getChanged(m3).connect(changed);
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(models).to.eql([m1, m2, m3, m1, m2, m3, m1, m2, m3]);
        expect(oldvals).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(newvals).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should invoke the changed function before the `changedSignal`', () => {
        var result: string[] = [];
        var changed1 = () => { result.push('c1'); };
        var changed2 = () => { result.push('c2'); };
        var p = new Property<Model, number>({ value: 0, changed: changed1 });
        var m = new Model();
        Property.getChanged(m).connect(changed2);
        p.set(m, 42);
        expect(result).to.eql(['c1', 'c2']);
      });

      it('should use the default factory for old value if value is not yet set', () => {
        var models: Model[] = [];
        var oldvals: number[] = [];
        var newvals: number[] = [];
        var changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        var tick = 42;
        var create = () => tick++;
        var p1 = new Property<Model, number>({ create: create, changed: changed });
        var p2 = new Property<Model, number>({ create: create, changed: changed });
        var p3 = new Property<Model, number>({ create: create, changed: changed });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(models).to.eql([m1, m2, m3, m1, m2, m3, m1, m2, m3]);
        expect(oldvals).to.eql([42, 43, 44, 45, 46, 47, 48, 49, 50]);
        expect(newvals).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should prefer the default factory over default value', () => {
        var models: Model[] = [];
        var oldvals: number[] = [];
        var newvals: number[] = [];
        var changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        var tick = 42;
        var create = () => tick++;
        var p1 = new Property<Model, number>({ value: 0, create: create, changed: changed });
        var p2 = new Property<Model, number>({ value: 0, create: create, changed: changed });
        var p3 = new Property<Model, number>({ value: 0, create: create, changed: changed });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(models).to.eql([m1, m2, m3, m1, m2, m3, m1, m2, m3]);
        expect(oldvals).to.eql([42, 43, 44, 45, 46, 47, 48, 49, 50]);
        expect(newvals).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should invoke the coerce function on the new value', () => {
        var coerce = (o: Model, v: number) => Math.max(0, v);
        var p = new Property<Model, number>({ coerce: coerce });
        var m = new Model();
        p.set(m, -10);
        expect(p.get(m)).to.be(0);
        p.set(m, 10);
        expect(p.get(m)).to.be(10);
        p.set(m, -42);
        expect(p.get(m)).to.be(0);
        p.set(m, 42);
        expect(p.get(m)).to.be(42);
        p.set(m, 0);
        expect(p.get(m)).to.be(0);
      });

      it('should invoke the compare function to compare values', () => {
        var called = false;
        var compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        var p = new Property<Model, number>({ value: 1, compare: compare });
        var m = new Model();
        p.set(m, 42);
        expect(called).to.be(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        var called = false;
        var changed = () => { called = true; };
        var compare = (v1: number, v2: number) => true;
        var p1 = new Property<Model, number>({ value: 1, changed: changed });
        var p2 = new Property<Model, number>({ value: 1, compare: compare, changed: changed });
        var m = new Model();
        p1.set(m, 1);
        p1.set(m, 1);
        p2.set(m, 1);
        p2.set(m, 2);
        p2.set(m, 3);
        p2.set(m, 4);
        expect(called).to.be(false);
      });

      it('should not emit the `changedSignal` if the value does not change', () => {
        var called = false;
        var changed = () => { called = true; };
        var compare = (v1: number, v2: number) => true;
        var p1 = new Property<Model, number>({ value: 1 });
        var p2 = new Property<Model, number>({ value: 1, compare: compare });
        var m = new Model();
        Property.getChanged(m).connect(changed);
        p1.set(m, 1);
        p1.set(m, 1);
        p2.set(m, 1);
        p2.set(m, 2);
        p2.set(m, 3);
        p2.set(m, 4);
        expect(called).to.be(false);
      });

    });

    describe('#coerce()', () => {

      it('should coerce the current value of the property', () => {
        var min = 20;
        var max = 50;
        var coerce = (m: Model, v: number) => Math.max(min, Math.min(v, max));
        var p = new Property<Model, number>({ value: 0, coerce: coerce });
        var m = new Model();
        p.set(m, 10);
        expect(p.get(m)).to.be(20);
        min = 30;
        p.coerce(m);
        expect(p.get(m)).to.be(30);
        min = 10;
        max = 20;
        p.coerce(m);
        expect(p.get(m)).to.be(20);
      });

      it('should invoke the changed function if the value changes', () => {
        var called = false;
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var changed = () => { called = true };
        var p = new Property<Model, number>({ value: 0, coerce: coerce, changed: changed });
        var m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should emit the `changedSignal` if the value changes', () => {
        var called = false;
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var changed = () => { called = true };
        var p = new Property<Model, number>({ value: 0, coerce: coerce });
        var m = new Model();
        Property.getChanged(m).connect(changed);
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should invoke the changed function before the `changedSignal`', () => {
        var result: string[] = [];
        var changed1 = () => { result.push('c1'); };
        var changed2 = () => { result.push('c2'); };
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var p = new Property<Model, number>({ value: 0, coerce: coerce, changed: changed1 });
        var m = new Model();
        Property.getChanged(m).connect(changed2);
        p.coerce(m);
        expect(result).to.eql(['c1', 'c2']);
      });

      it('should use the default value as old value if value is not yet set', () => {
        var oldval: number;
        var newval: number;
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        var p = new Property<Model, number>({ value: 0, coerce: coerce, changed: changed });
        var m = new Model();
        p.coerce(m);
        expect(oldval).to.be(0);
        expect(newval).to.be(20);
      });

      it('should use the default factory for old value if value is not yet set', () => {
        var oldval: number;
        var newval: number;
        var create = () => 12;
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        var p = new Property<Model, number>({ create: create, coerce: coerce, changed: changed });
        var m = new Model();
        p.coerce(m);
        expect(oldval).to.be(12);
        expect(newval).to.be(20);
      });

      it('should prefer the default factory over default value', () => {
        var oldval: number;
        var newval: number;
        var create = () => 12;
        var coerce = (m: Model, v: number) => Math.max(20, v);
        var changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        var p = new Property<Model, number>({ value: 0, create: create, coerce: coerce, changed: changed });
        var m = new Model();
        p.coerce(m);
        expect(oldval).to.be(12);
        expect(newval).to.be(20);
      });

      it('should invoke the compare function to compare values', () => {
        var called = false;
        var compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        var p = new Property<Model, number>({ value: 1, compare: compare });
        var m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        var called = false;
        var changed = () => { called = true; };
        var p = new Property<Model, number>({ value: 1, changed: changed });
        var m = new Model();
        p.coerce(m);
        expect(called).to.be(false);
      });

      it('should not emit the `changedSignal` if the value does not change', () => {
        var called = false;
        var changed = () => { called = true; };
        var p = new Property<Model, number>({ value: 1 });
        var m = new Model();
        Property.getChanged(m).connect(changed);
        p.coerce(m);
        expect(called).to.be(false);
      });

    });

  });

  describe('clearPropertyData()', () => {

    it('should clear all property data for a property owner', () => {
        var p1 = new Property<Model, number>({ value: 42 });
        var p2 = new Property<Model, number>({ value: 42 });
        var p3 = new Property<Model, number>({ value: 42 });
        var m1 = new Model();
        var m2 = new Model();
        var m3 = new Model();
        p1.set(m1, 1);
        p1.set(m2, 2);
        p1.set(m3, 3);
        p2.set(m1, 4);
        p2.set(m2, 5);
        p2.set(m3, 6);
        p3.set(m1, 7);
        p3.set(m2, 8);
        p3.set(m3, 9);
        expect(p1.get(m1)).to.be(1);
        expect(p1.get(m2)).to.be(2);
        expect(p1.get(m3)).to.be(3);
        expect(p2.get(m1)).to.be(4);
        expect(p2.get(m2)).to.be(5);
        expect(p2.get(m3)).to.be(6);
        expect(p3.get(m1)).to.be(7);
        expect(p3.get(m2)).to.be(8);
        expect(p3.get(m3)).to.be(9);
        clearPropertyData(m1);
        expect(p1.get(m1)).to.be(42);
        expect(p1.get(m2)).to.be(2);
        expect(p1.get(m3)).to.be(3);
        expect(p2.get(m1)).to.be(42);
        expect(p2.get(m2)).to.be(5);
        expect(p2.get(m3)).to.be(6);
        expect(p3.get(m1)).to.be(42);
        expect(p3.get(m2)).to.be(8);
        expect(p3.get(m3)).to.be(9);
        clearPropertyData(m2);
        expect(p1.get(m1)).to.be(42);
        expect(p1.get(m2)).to.be(42);
        expect(p1.get(m3)).to.be(3);
        expect(p2.get(m1)).to.be(42);
        expect(p2.get(m2)).to.be(42);
        expect(p2.get(m3)).to.be(6);
        expect(p3.get(m1)).to.be(42);
        expect(p3.get(m2)).to.be(42);
        expect(p3.get(m3)).to.be(9);
        clearPropertyData(m3);
        expect(p1.get(m1)).to.be(42);
        expect(p1.get(m2)).to.be(42);
        expect(p1.get(m3)).to.be(42);
        expect(p2.get(m1)).to.be(42);
        expect(p2.get(m2)).to.be(42);
        expect(p2.get(m3)).to.be(42);
        expect(p3.get(m1)).to.be(42);
        expect(p3.get(m2)).to.be(42);
        expect(p3.get(m3)).to.be(42);
    });

  });

});
