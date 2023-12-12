// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Util } from "../Util.js";
import { ParameterNumber, Subject, ParameterBoolean, ParameterString, SubjectEvent,
     Observer, Parameter } from "../Observe.js";
import { AbstractSubject } from "../AbstractSubject.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testParameterNumber1);
  schedule(testParameterNumber2);
  schedule(testParameterNumber3);
  schedule(testParameterNumber4);
};

const groupName = 'ParameterNumberTest.';

function testParameterNumber1() {
  startTest(groupName+'testParameterNumber1');
  const mockSubj1 = new MockSubject1();
  assertEquals(0, mockSubj1.getFooness());
  assertEquals(0, mockSubj1.getFooBarness());
  // now make parameters
  const paramFoo = new ParameterNumber(mockSubj1, MockSubject1.FOONESS,
      MockSubject1.FOONESS,
      () => mockSubj1.getFooness(),
      (a: number) => mockSubj1.setFooness(a));
  assertEquals('FOONESS', paramFoo.getName());
  assertTrue(paramFoo.nameEquals('fooness'));
  assertEquals(mockSubj1, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterNumber);
  assertEquals(0, paramFoo.getValue());
  assertEquals('0', paramFoo.getAsString());
  assertEquals(undefined, paramFoo.setValue(10));
  assertEquals(10, paramFoo.getValue());
  assertEquals('10', paramFoo.getAsString());
  // Using binary to decimal converter at www.binaryconvert.com/convert_double.html
  // 0x400921FB54442D17 = 3.14159265358979267190875
  // 0x400921FB54442D18 = 3.141592653589793115997963
  // 0x400921FB54442D19 = 3.141592653589793560087173
  paramFoo.setValue(parseFloat('3.14159265358979323846'));
  // this is the closest that floating point can represent pi:
  assertEquals(3.14159265358979311600, paramFoo.getValue());
  assertEquals('3.141592653589793', String(paramFoo.getValue()));
  assertRoughlyEquals(Math.PI, paramFoo.getValue(), 1e-15);
  assertEquals(0, paramFoo.getLowerLimit());
  assertEquals(Infinity, paramFoo.getUpperLimit());
  // can't set value less than lowerLimit
  assertThrows(() => paramFoo.setValue(-1));
  // can't set lowerLimit more than value
  assertThrows(() => paramFoo.setLowerLimit(10));
  // can't set upperLimt less than value
  assertThrows(() => paramFoo.setUpperLimit(1));
  assertEquals(paramFoo, paramFoo.setLowerLimit(-100));
  assertEquals(-100, paramFoo.getLowerLimit());
  assertEquals(undefined, paramFoo.setValue(-10));
  assertEquals(-10, paramFoo.getValue());
  assertEquals(paramFoo, paramFoo.setUpperLimit(0));
  assertEquals(0, paramFoo.getUpperLimit());
  assertThrows(() => paramFoo.setValue(1));
  assertEquals(paramFoo, paramFoo.setLowerLimit(Number.NEGATIVE_INFINITY));
  assertEquals(undefined, paramFoo.setValue(-1e200));
  // compare to the next representable number that is more negative
  assertRoughlyEquals(-1.00000000000000013969727991388E200, paramFoo.getValue(), 1E185);
  // test making a param from a name with an underbar in it, here 'foo_barness'
  const paramFooBar = new ParameterNumber(mockSubj1, MockSubject1.FOOBARNESS,
      MockSubject1.FOOBARNESS,
      () => mockSubj1.getFooBarness(),
      (a: number) => mockSubj1.setFooBarness(a));
  assertEquals(Util.toName(MockSubject1.FOOBARNESS), paramFooBar.getName());
  assertTrue(paramFooBar.nameEquals(MockSubject1.FOOBARNESS));
  assertEquals(mockSubj1, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  assertEquals(0, paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(10));
  assertEquals(10, paramFooBar.getValue());
  paramFoo.setFromString('-7');
  assertEquals(-7, paramFoo.getValue());
  paramFoo.setFromString('-2e-5');
  assertEquals(-2e-5, paramFoo.getValue());
  // set to non-numeric value
  assertThrows(() => paramFoo.setFromString('foo'));
};

function testParameterNumber2() {
  startTest(groupName+'testParameterNumber2');
  const mockSubj2 = new MockSubject2();
  assertEquals(0, mockSubj2.getFooness());
  assertEquals(0, mockSubj2.getFooBarness());
  // now make parameters
  const paramFoo = new ParameterNumber(mockSubj2, MockSubject2.FOONESS,
      MockSubject2.FOONESS,
      () => mockSubj2.getFooness(),
      (a: number) => mockSubj2.setFooness(a));
  mockSubj2.addParameter(paramFoo);
  assertEquals('FOONESS', paramFoo.getName());
  assertEquals(mockSubj2, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterNumber);
  assertEquals(paramFoo, mockSubj2.getParameterNumber(MockSubject2.FOONESS));
  assertThrows(()=>  mockSubj2.getParameterBoolean(MockSubject2.FOONESS) );
  assertEquals(0, paramFoo.getValue());
  assertEquals(undefined, paramFoo.setValue(10));
  assertEquals(10, paramFoo.getValue());
  paramFoo.setValue(parseFloat('3.14159265358979323846'));
  // this is the closest that floating point can represent pi:
  assertEquals(3.14159265358979311600, paramFoo.getValue());
  assertEquals('3.141592653589793', String(paramFoo.getValue()));
  assertRoughlyEquals(Math.PI, paramFoo.getValue(), 1e-15);
  assertEquals(0, paramFoo.getLowerLimit());
  assertEquals(Infinity, paramFoo.getUpperLimit());
  // test making a param from a name with an underbar in it, here 'foo_barness'
  const paramFooBar = new ParameterNumber(mockSubj2, MockSubject2.FOOBARNESS,
      MockSubject2.FOOBARNESS,
      () => mockSubj2.getFooBarness(),
      (a: number) => mockSubj2.setFooBarness(a));
  mockSubj2.addParameter(paramFooBar);
  assertEquals(Util.toName(MockSubject2.FOOBARNESS), paramFooBar.getName());
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  assertEquals(0, paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(10));
  assertEquals(10, paramFooBar.getValue());
  assertEquals(paramFooBar, mockSubj2.getParameterNumber(MockSubject2.FOOBARNESS));
};

function testParameterNumber3() {
  startTest(groupName+'testParameterNumber3');
  const mockSubj3 = new MockSubject3();
  assertEquals(0, mockSubj3.getFooness());
  assertEquals(0, mockSubj3.getFooBarness());
  // now make parameters
  const paramFoo = new ParameterNumber(mockSubj3, MockSubject3.FOONESS,
      MockSubject3.FOONESS,
      () => mockSubj3.getFooness(),
      (a: number) => mockSubj3.setFooness(a));
  assertEquals('FOONESS', paramFoo.getName());
  assertEquals(mockSubj3, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterNumber);
  assertEquals(0, paramFoo.getValue());
  assertEquals(undefined, paramFoo.setValue(10));
  assertEquals(10, paramFoo.getValue());
  paramFoo.setValue(parseFloat('3.14159265358979323846'));
  // this is the closest that floating point can represent pi:
  assertEquals('3.141592653589793', String(paramFoo.getValue()));
  assertRoughlyEquals(Math.PI, paramFoo.getValue(), 1e-15);
  assertEquals(0, paramFoo.getLowerLimit());
  assertEquals(Infinity, paramFoo.getUpperLimit());
  // test making a param from a name with an underbar in it, here 'foo_barness'
  const paramFooBar = new ParameterNumber(mockSubj3, MockSubject3.FOOBARNESS,
      MockSubject3.FOOBARNESS,
      () => mockSubj3.getFooBarness(),
      (a: number) => mockSubj3.setFooBarness(a));
  assertEquals(MockSubject3.FOOBARNESS, paramFooBar.getName());
  assertEquals(mockSubj3, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  assertEquals(0, paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(10));
  assertEquals(10, paramFooBar.getValue());
};

// ParameterNumber with array of choices and values
function testParameterNumber4() {
  startTest(groupName+'testParameterNumber4');
  const mockSubj2 = new MockSubject4();

  // make a parameter with choices and non-integer values
  const pi = Math.PI; //3.141592653589793;
  const e = Math.E; //2.718281828459045;
  const sqrt2 = Math.sqrt(2); //1.4142135623730951;
  const paramFooness = new ParameterNumber(mockSubj2, MockSubject4.FOONESS,
      MockSubject4.FOONESS,
      () => mockSubj2.getFooness(),
      (a: number) => mockSubj2.setFooness(a),
      ['pi', 'e', 'sqrt(2)'], [pi, e, sqrt2]);
  mockSubj2.addParameter(paramFooness);
  assertEquals(MockSubject4.FOONESS, paramFooness.getName());
  assertEquals(mockSubj2, paramFooness.getSubject());
  assertTrue(paramFooness instanceof ParameterNumber);
  // we can start with a non-allowed value
  assertRoughlyEquals(0.1, paramFooness.getValue(), 1E-15);
  // set to a non-allowed value
  assertThrows(() => paramFooness.setValue(10));
  assertRoughlyEquals(0.1, paramFooness.getValue(), 1E-15);
  assertEquals(paramFooness, mockSubj2.getParameter(MockSubject4.FOONESS));
  assertEquals(paramFooness, mockSubj2.getParameterNumber(MockSubject4.FOONESS));
  assertThrows(()=>  mockSubj2.getParameterString(MockSubject4.FOONESS) );
  assertThrows(()=>  mockSubj2.getParameterBoolean(MockSubject4.FOONESS) );
  // check the list of choices/values
  assertEquals(3, paramFooness.getChoices().length);
  assertEquals(3, paramFooness.getValues().length);
  assertEquals('pi', paramFooness.getChoices()[0]);
  assertEquals(pi, Number(paramFooness.getValues()[0]));
  paramFooness.setValue(Number(paramFooness.getValues()[0]));
  assertEquals(pi, paramFooness.getValue());
  assertEquals('e', paramFooness.getChoices()[1]);
  assertEquals(e, Number(paramFooness.getValues()[1]));
  paramFooness.setValue(Number(paramFooness.getValues()[1]));
  assertEquals(e, paramFooness.getValue());
  assertEquals('sqrt(2)', paramFooness.getChoices()[2]);
  assertEquals(sqrt2, Number(paramFooness.getValues()[2]));
  paramFooness.setValue(Number(paramFooness.getValues()[2]));
  assertEquals(sqrt2, paramFooness.getValue());

  // make a parameter with choices and integer values
  const paramFooBar = new ParameterNumber(mockSubj2, MockSubject4.FOOBARNESS,
      MockSubject4.FOOBARNESS,
      () => mockSubj2.getFooBarness(),
      (a: number) => mockSubj2.setFooBarness(a),
      ['none', 'some', 'lots'], [0, 5, 1000]);
  mockSubj2.addParameter(paramFooBar);
  assertEquals(MockSubject4.FOOBARNESS, paramFooBar.getName());
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  // we can start with a non-allowed value
  assertEquals(1000000, paramFooBar.getValue());
  // set to a non-allowed value
  assertThrows(() => paramFooBar.setValue(10));
  assertEquals(1000000, paramFooBar.getValue());
  assertEquals(paramFooBar, mockSubj2.getParameterNumber(MockSubject4.FOOBARNESS));
  assertThrows(()=>  mockSubj2.getParameterString(MockSubject4.FOONESS) );
  assertThrows(()=>  mockSubj2.getParameterBoolean(MockSubject4.FOONESS) );
  // check the list of choices/values
  assertEquals(3, paramFooBar.getChoices().length);
  assertEquals(3, paramFooBar.getValues().length);
  assertEquals('none', paramFooBar.getChoices()[0]);
  assertEquals(0, Number(paramFooBar.getValues()[0]));
  paramFooBar.setValue(Number(paramFooBar.getValues()[0]));
  assertEquals(0, paramFooBar.getValue());
  assertEquals('some', paramFooBar.getChoices()[1]);
  assertEquals(5, Number(paramFooBar.getValues()[1]));
  paramFooBar.setValue(Number(paramFooBar.getValues()[1]));
  assertEquals(5, paramFooBar.getValue());
  assertEquals('lots', paramFooBar.getChoices()[2]);
  assertEquals(1000, Number(paramFooBar.getValues()[2]));
  paramFooBar.setValue(Number(paramFooBar.getValues()[2]));
  assertEquals(1000, paramFooBar.getValue());

  // make a parameter with choices and integers
  const bazChoices = ['red', 'green', 'blue', 'black'];
  const paramBaz = new ParameterNumber(mockSubj2, MockSubject4.BAZ,
      MockSubject4.BAZ,
      () => mockSubj2.getBaz(),
      (a: number) => mockSubj2.setBaz(a),
      bazChoices, Util.range(bazChoices.length)
      );
  mockSubj2.addParameter(paramBaz);
  assertEquals(MockSubject4.BAZ, paramBaz.getName());
  assertEquals(mockSubj2, paramBaz.getSubject());
  assertTrue(paramBaz instanceof ParameterNumber);
  assertEquals(0, paramBaz.getValue());
  // set to a non-allowed value
  assertThrows(() => paramBaz.setValue(10));
  assertEquals(0, paramBaz.getValue());
  assertEquals(paramBaz, mockSubj2.getParameterNumber(MockSubject4.BAZ));
  assertThrows(()=>  mockSubj2.getParameterString(MockSubject4.BAZ) );
  assertThrows(()=>  mockSubj2.getParameterBoolean(MockSubject4.BAZ) );
  // check the list of choices/values
  assertEquals(4, paramBaz.getChoices().length);
  assertEquals(4, paramBaz.getValues().length);

  assertEquals('red', paramBaz.getChoices()[0]);
  assertEquals(0, Number(paramBaz.getValues()[0]));
  paramBaz.setValue(Number(paramBaz.getValues()[0]));
  assertEquals(0, paramBaz.getValue());

  assertEquals('green', paramBaz.getChoices()[1]);
  assertEquals(1, Number(paramBaz.getValues()[1]));
  paramBaz.setValue(Number(paramBaz.getValues()[1]));
  assertEquals(1, paramBaz.getValue());

  assertEquals('blue', paramBaz.getChoices()[2]);
  assertEquals(2, Number(paramBaz.getValues()[2]));
  paramBaz.setValue(Number(paramBaz.getValues()[2]));
  assertEquals(2, paramBaz.getValue());

  assertEquals('black', paramBaz.getChoices()[3]);
  assertEquals(3, Number(paramBaz.getValues()[3]));
  paramBaz.setValue(Number(paramBaz.getValues()[3]));
  assertEquals(3, paramBaz.getValue());

  // check for exception when different number of choices and values
  assertThrows( () => {
      new ParameterNumber(mockSubj2, MockSubject4.FOOBARNESS,
      MockSubject4.FOOBARNESS,
      () => mockSubj2.getFooBarness(),
      (a: number) => mockSubj2.setFooBarness(a),
      ['none', 'some', 'lots', 'too many'], [0, 5, 1000]);
  });
};

class MockSubject1 implements Subject {
    fooness_ = 0;
    fooBarness_ = 0;
    symbol_ = '';
  constructor() {
  };
  getFooness(): number {
    return this.fooness_;
  };
  setFooness(value: number) {
    this.fooness_ = value;
  };
  getFooBarness(): number {
    return this.fooBarness_;
  };
  setFooBarness(value: number) {
    this.fooBarness_ = value;
  };
  /** @inheritDoc */
  getName(): string { return ''; };
  addObserver(observer: Observer): void { observer===undefined; };
  removeObserver(observer: Observer): void { observer===undefined; };
  getObservers(): Observer[] { return []; };
  getParameters(): Parameter[] { return []; };
  getParameter(name: string): Parameter { throw name; };
  getParameterBoolean(name: string): ParameterBoolean { throw name; };
  getParameterNumber(name: string): ParameterNumber { throw name; };
  getParameterString(name: string): ParameterString { throw name; };
  broadcastParameter(name: string): void { name===undefined; };
  broadcast(event: SubjectEvent): void { event===undefined; };
  toStringShort(): string { return 'MockSubject1'; };
  static FOONESS = 'FOONESS';
  static FOOBARNESS = 'FOO_BARNESS';
} // end class

class MockSubject2 extends AbstractSubject {
  fooness_ = 0;
  fooBarness_ = 0;
  constructor() {
    super('MOCK');
  };
  getClassName() {
    return 'MockSubject2';
  };
  getFooness(): number {
    return this.fooness_;
  };
  setFooness(value: number) {
    this.fooness_ = value;
  };
  getFooBarness(): number {
    return this.fooBarness_;
  };
  setFooBarness(value: number) {
    this.fooBarness_ = value;
  };
  static FOONESS = 'fooness';
  static FOOBARNESS = 'foo-barness';
} // end class

class MockSubject3 extends AbstractSubject {
  fooness_ = 0;
  fooBarness_ = 0;
  constructor() {
    super('MOCK');
  };
  /** @inheritDoc */
  getClassName() {
    return 'MockSubject3';
  };
  getFooness(): number {
    return this.fooness_;
  };
  setFooness(value: number) {
    this.fooness_ = value;
  };
  getFooBarness(): number {
    return this.fooBarness_;
  };
  setFooBarness(value: number) {
    this.fooBarness_ = value;
  };
  static FOONESS = 'FOONESS';
  static FOOBARNESS = 'FOO_BARNESS';
} // end class

class MockSubject4 extends AbstractSubject {
  fooness_ = 0.1;
  fooBarness_ = 1000000;
  baz_ = 0;
  constructor() {
    super('MOCK');
  };
  /** @inheritDoc */
  getClassName() {
    return 'MockSubject4';
  };
  getFooness(): number {
    return this.fooness_;
  };
  setFooness(value: number) {
    this.fooness_ = value;
  };
  getFooBarness(): number {
    return this.fooBarness_;
  };
  setFooBarness(value: number) {
    this.fooBarness_ = value;
  };
  getBaz(): number {
    return this.baz_;
  };
  setBaz(value: number) {
    this.baz_ = value;
  };
  static FOONESS = 'FOONESS';
  static FOOBARNESS = 'FOO_BARNESS';
  static BAZ = 'BAZ';
} // end class
