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
  Signal
} from 'phosphor-signaling';

import {
  IChangedArgs, Property, clearPropertyData
} from '../../lib/index';


class Model {
  dummyValue = 42;
}


describe('phosphor-properties', () => {

  describe('Property', () => {

    describe('#constructor()', () => {

      it('should accept a single options argument', () => {
        let p = new Property<Model, number>({
          name: 'p',
          value: 12,
          create: (owner) => 42,
          coerce: (owner, value) => Math.max(0, value),
          compare: (oldValue, newValue) => oldValue === newValue,
          changed: (owner, oldValue, newValue) => { },
          notify: new Signal<Model, IChangedArgs<number>>(),
        });
        expect(p instanceof Property).to.be(true);
      });

    });

    describe('#name', () => {

      it('should be the name provided to the constructor', () => {
        let p = new Property<Model, number>({ name: 'p' });
        expect(p.name).to.be('p');
      });

      it('should be a read-only property', () => {
        let p = new Property<Model, number>({ name: 'p' });
        expect(() => { p.name = 'q'; }).to.throwException();
      });

    });

    describe('#notify', () => {

      it('should be the signal provided to the constructor', () => {
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', notify });
        expect(p.notify).to.be(notify);
      });

      it('should be a read-only property', () => {
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', notify });
        expect(() => { p.notify = null }).to.throwException();
      });

    });

    describe('#get()', () => {

      it('should return the current value of the property', () => {
        let p1 = new Property<Model, number>({ name: 'p1' });
        let p2 = new Property<Model, number>({ name: 'p2' });
        let p3 = new Property<Model, number>({ name: 'p3' });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let p1 = new Property<Model, number>({ name: 'p1', value: 42 });
        let p2 = new Property<Model, number>({ name: 'p2', value: 43 });
        let p3 = new Property<Model, number>({ name: 'p3', value: 44 });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let tick = 42;
        let create = () => tick++;
        let p1 = new Property<Model, number>({ name: 'p1', create });
        let p2 = new Property<Model, number>({ name: 'p2', create });
        let p3 = new Property<Model, number>({ name: 'p3', create });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let tick = 42;
        let create = () => tick++;
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, create });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, create });
        let p3 = new Property<Model, number>({ name: 'p3', value: 1, create });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let called = false;
        let coerce = (m: Model, v: number) => (called = true,  v);
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, coerce });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, coerce });
        let p3 = new Property<Model, number>({ name: 'p3', value: 1, coerce });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let called = false;
        let compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, compare });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, compare });
        let p3 = new Property<Model, number>({ name: 'p3', value: 1, compare });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let called = false;
        let changed = () => { called = true; };
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, changed });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, changed });
        let p3 = new Property<Model, number>({ name: 'p3', value: 1, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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

      it('should not emit the notify signal', () => {
        let called = false;
        let changed = () => { called = true; };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, notify });
        let p2 = new Property<Model, number>({ name: 'p1', value: 1, notify });
        let p3 = new Property<Model, number>({ name: 'p1', value: 1, notify });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        notify.bind(m1).connect(changed);
        notify.bind(m2).connect(changed);
        notify.bind(m3).connect(changed);
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
        let p1 = new Property<Model, number>({ name: 'p1' });
        let p2 = new Property<Model, number>({ name: 'p2' });
        let p3 = new Property<Model, number>({ name: 'p3' });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let models: Model[] = [];
        let oldvals: number[] = [];
        let newvals: number[] = [];
        let changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        let p1 = new Property<Model, number>({ name: 'p1', value: 0, changed });
        let p2 = new Property<Model, number>({ name: 'p2', value: 0, changed });
        let p3 = new Property<Model, number>({ name: 'p3', value: 0, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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

      it('should emit the notify signal if the value changes', () => {
        let models: Model[] = [];
        let names: string[] = [];
        let oldvals: number[] = [];
        let newvals: number[] = [];
        let notify = new Signal<Model, IChangedArgs<number>>();
        let changed = (sender: Model, args: IChangedArgs<number>) => {
          models.push(sender);
          names.push(args.name);
          oldvals.push(args.oldValue);
          newvals.push(args.newValue);
        };
        let p1 = new Property<Model, number>({ name: 'p1', value: 0, notify });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, notify });
        let p3 = new Property<Model, number>({ name: 'p3', value: 2, notify });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
        notify.bind(m1).connect(changed);
        notify.bind(m2).connect(changed);
        notify.bind(m3).connect(changed);
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
        expect(names).to.eql(['p1', 'p1', 'p1', 'p2', 'p2', 'p2', 'p3', 'p3', 'p3']);
        expect(oldvals).to.eql([0, 0, 0, 1, 1, 1, 2, 2, 2]);
        expect(newvals).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should call the changed function before notify signal', () => {
        let result: string[] = [];
        let changed = () => { result.push('c1'); };
        let changed2 = () => { result.push('c2'); };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', value: 0, changed, notify });
        let m = new Model();
        notify.bind(m).connect(changed2);
        p.set(m, 42);
        expect(result).to.eql(['c1', 'c2']);
      });

      it('should use the default factory for old value if value is not yet set', () => {
        let models: Model[] = [];
        let oldvals: number[] = [];
        let newvals: number[] = [];
        let changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        let tick = 42;
        let create = () => tick++;
        let p1 = new Property<Model, number>({ name: 'p1', create, changed });
        let p2 = new Property<Model, number>({ name: 'p2', create, changed });
        let p3 = new Property<Model, number>({ name: 'p3', create, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let models: Model[] = [];
        let oldvals: number[] = [];
        let newvals: number[] = [];
        let changed = (m: Model, o: number, n: number) => {
          models.push(m);
          oldvals.push(o);
          newvals.push(n);
        };
        let tick = 42;
        let create = () => tick++;
        let p1 = new Property<Model, number>({ name: 'p1', value: 0, create, changed });
        let p2 = new Property<Model, number>({ name: 'p2', value: 0, create, changed });
        let p3 = new Property<Model, number>({ name: 'p3', value: 0, create, changed });
        let m1 = new Model();
        let m2 = new Model();
        let m3 = new Model();
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
        let coerce = (o: Model, v: number) => Math.max(0, v);
        let p = new Property<Model, number>({ name: 'p', coerce });
        let m = new Model();
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

      it('should not invoke the compare function if there are no listeners', () => {
        let called = false;
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.be(false);
      });

      it('should invoke the compare function if there is a changed function', () => {
        let called = false;
        let changed = () => { };
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, changed });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.be(true);
      });

      it('should invoke the compare function if there is a notify signal', () => {
        let called = false;
        let notify = new Signal<Model, IChangedArgs<number>>();
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, notify });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.be(true);
      });

      it('should invoke the compare function if there is a changed function and notify signal', () => {
        let called = false;
        let changed = () => { };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, changed, notify });
        let m = new Model();
        p.set(m, 42);
        expect(called).to.be(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        let called = false;
        let changed = () => { called = true; };
        let compare = (v1: number, v2: number) => true;
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, changed });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, compare, changed });
        let m = new Model();
        p1.set(m, 1);
        p1.set(m, 1);
        p2.set(m, 1);
        p2.set(m, 2);
        p2.set(m, 3);
        p2.set(m, 4);
        expect(called).to.be(false);
      });

      it('should not emit the notify signal if the value does not change', () => {
        let called = false;
        let changed = () => { called = true; };
        let compare = (v1: number, v2: number) => true;
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p1 = new Property<Model, number>({ name: 'p1', value: 1, notify });
        let p2 = new Property<Model, number>({ name: 'p2', value: 1, compare, notify });
        let m = new Model();
        notify.bind(m).connect(changed);
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
        let min = 20;
        let max = 50;
        let coerce = (m: Model, v: number) => Math.max(min, Math.min(v, max));
        let p = new Property<Model, number>({ name: 'p', value: 0, coerce });
        let m = new Model();
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
        let called = false;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = () => { called = true };
        let p = new Property<Model, number>({ name: 'p', value: 0, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should emit the notify signal if the value changes', () => {
        let called = false;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = () => { called = true };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', value: 0, coerce, notify });
        let m = new Model();
        notify.bind(m).connect(changed);
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should call the changed function before notify signal', () => {
        let result: string[] = [];
        let changed = () => { result.push('c1'); };
        let changed2 = () => { result.push('c2'); };
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', value: 0, coerce, changed, notify });
        let m = new Model();
        notify.bind(m).connect(changed2);
        p.coerce(m);
        expect(result).to.eql(['c1', 'c2']);
      });

      it('should use the default value as old value if value is not yet set', () => {
        let oldval: number;
        let newval: number;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        let p = new Property<Model, number>({ name: 'p', value: 0, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(oldval).to.be(0);
        expect(newval).to.be(20);
      });

      it('should use the default factory for old value if value is not yet set', () => {
        let oldval: number;
        let newval: number;
        let create = () => 12;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        let p = new Property<Model, number>({ name: 'p', create, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(oldval).to.be(12);
        expect(newval).to.be(20);
      });

      it('should prefer the default factory over default value', () => {
        let oldval: number;
        let newval: number;
        let create = () => 12;
        let coerce = (m: Model, v: number) => Math.max(20, v);
        let changed = (m: Model, o: number, n: number) => { oldval = o; newval = n; };
        let p = new Property<Model, number>({ name: 'p', value: 0, create, coerce, changed });
        let m = new Model();
        p.coerce(m);
        expect(oldval).to.be(12);
        expect(newval).to.be(20);
      });

      it('should not invoke the compare function if there are not listeners', () => {
        let called = false;
        let compare = (v1: number, v2: number) => (called = true,  v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(false);
      });

      it('should invoke the compare function if there is a changed function', () => {
        let called = false;
        let changed = () => { };
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should invoke the compare function if there is a notify signal', () => {
        let called = false;
        let notify = new Signal<Model, IChangedArgs<number>>();
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, notify });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should invoke the compare function if there is a changed function and notify signal', () => {
        let called = false;
        let changed = () => { };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let compare = (v1: number, v2: number) => (called = true, v1 === v2);
        let p = new Property<Model, number>({ name: 'p', value: 1, compare, changed, notify });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(true);
      });

      it('should not invoke the changed function if the value does not change', () => {
        let called = false;
        let changed = () => { called = true; };
        let p = new Property<Model, number>({ name: 'p', value: 1, changed });
        let m = new Model();
        p.coerce(m);
        expect(called).to.be(false);
      });

      it('should not emit the notify signal if the value does not change', () => {
        let called = false;
        let changed = () => { called = true; };
        let notify = new Signal<Model, IChangedArgs<number>>();
        let p = new Property<Model, number>({ name: 'p', value: 1, notify });
        let m = new Model();
        notify.bind(m).connect(changed);
        p.coerce(m);
        expect(called).to.be(false);
      });

    });

  });

  describe('clearPropertyData()', () => {

    it('should clear all property data for a property owner', () => {
      let p1 = new Property<Model, number>({ name: 'p1', value: 42 });
      let p2 = new Property<Model, number>({ name: 'p2', value: 42 });
      let p3 = new Property<Model, number>({ name: 'p3', value: 42 });
      let m1 = new Model();
      let m2 = new Model();
      let m3 = new Model();
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
