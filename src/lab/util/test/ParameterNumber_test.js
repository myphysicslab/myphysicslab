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

goog.provide('myphysicslab.lab.util.test.ParameterNumber_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Subject');
goog.require('goog.testing.jsunit');


var testParameterNumber1 = function() {
  var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
  var Util = myphysicslab.lab.util.Util;
  /**
  @constructor
  @implements {myphysicslab.lab.util.Subject}
  */
  var MockSubject1 = function() {
    /**
    * @type {number}
    * @private
    */
    this.fooness_ = 0;
    /**
    * @type {number}
    * @private
    */
    this.fooBarness_ = 0;
    /**
    * @type {string}
    * @private
    */
    this.symbol_ = '';
    /**
    * @type {?myphysicslab.lab.util.Terminal}
    * @private
    */
    this.terminal_ = null;
  };
  MockSubject1.FOONESS = 'FOONESS';
  MockSubject1.FOOBARNESS = 'FOO_BARNESS';
  /**
  @return {number}
  */
  MockSubject1.prototype.getFooness = function() {
    return this.fooness_;
  };
  /**
  @param {number} value
  */
  MockSubject1.prototype.setFooness = function(value) {
    this.fooness_ = value;
  };
  /**
  @return {number}
  */
  MockSubject1.prototype.getFooBarness = function() {
    return this.fooBarness_;
  };
  /**
  @param {number} value
  */
  MockSubject1.prototype.setFooBarness = function(value) {
    this.fooBarness_ = value;
  };
  /** @inheritDoc */
  MockSubject1.prototype.getName = function() { return ''; };
  /** @inheritDoc */
  MockSubject1.prototype.addObserver = function(observer) {};
  /** @inheritDoc */
  MockSubject1.prototype.removeObserver = function(observer) {};
  /** @inheritDoc */
  MockSubject1.prototype.getObservers = function() { return []; };
  /** @inheritDoc */
  MockSubject1.prototype.getParameters = function() { return []; };
  /** @inheritDoc */
  MockSubject1.prototype.getParameter = function(name) { throw new Error(); };
  /** @inheritDoc */
  MockSubject1.prototype.getParameterBoolean = function(name) { throw new Error(); };
  /** @inheritDoc */
  MockSubject1.prototype.getParameterNumber = function(name) { throw new Error(); };
  /** @inheritDoc */
  MockSubject1.prototype.getParameterString = function(name) { throw new Error(); };
  /** @inheritDoc */
  MockSubject1.prototype.broadcastParameter = function(name) {};
  /** @inheritDoc */
  MockSubject1.prototype.broadcast = function(event) {};
  /** @inheritDoc */
  MockSubject1.prototype.toStringShort = function() { return 'MockSubject1'; };
  var mockSubj1 = new MockSubject1();
  assertEquals(0, mockSubj1.getFooness());
  assertEquals(0, mockSubj1.getFooBarness());
  // now make parameters
  var paramFoo = new ParameterNumber(mockSubj1, MockSubject1.FOONESS,
      MockSubject1.FOONESS,
      goog.bind(mockSubj1.getFooness, mockSubj1),
      goog.bind(mockSubj1.setFooness, mockSubj1));
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
  assertEquals(Util.POSITIVE_INFINITY, paramFoo.getUpperLimit());
  // can't set value less than lowerLimit
  assertThrows(function() { paramFoo.setValue(-1); });
  // can't set lowerLimit more than value
  assertThrows(function() { paramFoo.setLowerLimit(10); });
  // can't set upperLimt less than value
  assertThrows(function() { paramFoo.setUpperLimit(1); });
  assertEquals(paramFoo, paramFoo.setLowerLimit(-100));
  assertEquals(-100, paramFoo.getLowerLimit());
  assertEquals(undefined, paramFoo.setValue(-10));
  assertEquals(-10, paramFoo.getValue());
  assertEquals(paramFoo, paramFoo.setUpperLimit(0));
  assertEquals(0, paramFoo.getUpperLimit());
  assertThrows(function() { paramFoo.setValue(1); });
  assertEquals(paramFoo, paramFoo.setLowerLimit(Util.NEGATIVE_INFINITY));
  assertEquals(undefined, paramFoo.setValue(-1e200));
  // compare to the next representable number that is more negative
  assertRoughlyEquals(-1.00000000000000013969727991388E200, paramFoo.getValue(), 1E185);
  // test making a param from a name with an underbar in it, here 'foo_barness'
  var paramFooBar = new ParameterNumber(mockSubj1, MockSubject1.FOOBARNESS,
      MockSubject1.FOOBARNESS,
      goog.bind(mockSubj1.getFooBarness, mockSubj1),
      goog.bind(mockSubj1.setFooBarness, mockSubj1));
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
  assertThrows(function() { paramFoo.setFromString('foo'); });
};
goog.exportProperty(window, 'testParameterNumber1', testParameterNumber1);


var testParameterNumber2 = function() {
  var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
  var Util = myphysicslab.lab.util.Util;
  /**
  @constructor
  @extends {myphysicslab.lab.util.AbstractSubject}
  */
  var MockSubject2 = function() {
    myphysicslab.lab.util.AbstractSubject.call(this, 'MOCK');
    /**
    * @type {number}
    * @private
    */
    this.fooness_ = 0;
    /**
    * @type {number}
    * @private
    */
    this.fooBarness_ = 0;
  };
  goog.inherits(MockSubject2, myphysicslab.lab.util.AbstractSubject);

  MockSubject2.FOONESS = 'fooness';
  MockSubject2.FOOBARNESS = 'foo-barness';
  /** @inheritDoc */
  MockSubject2.prototype.getClassName = function() {
    return 'MockSubject2';
  };
  /**
  @return {number}
  */
  MockSubject2.prototype.getFooness = function() {
    return this.fooness_;
  };
  /**
  @param {number} value
  */
  MockSubject2.prototype.setFooness = function(value) {
    this.fooness_ = value;
  };
  /**
  @return {number}
  */
  MockSubject2.prototype.getFooBarness = function() {
    return this.fooBarness_;
  };
  /**
  @param {number} value
  */
  MockSubject2.prototype.setFooBarness = function(value) {
    this.fooBarness_ = value;
  };
  /** @type {!MockSubject2} */
  var mockSubj2 = new MockSubject2();
  assertEquals(0, mockSubj2.getFooness());
  assertEquals(0, mockSubj2.getFooBarness());
  // now make parameters
  var paramFoo = new ParameterNumber(mockSubj2, MockSubject2.FOONESS,
      MockSubject2.FOONESS,
      goog.bind(mockSubj2.getFooness, mockSubj2),
      goog.bind(mockSubj2.setFooness, mockSubj2));
  mockSubj2.addParameter(paramFoo);
  assertEquals('FOONESS', paramFoo.getName());
  assertEquals(mockSubj2, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterNumber);
  assertEquals(paramFoo, mockSubj2.getParameterNumber(MockSubject2.FOONESS));
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.FOONESS) });
  assertEquals(0, paramFoo.getValue());
  assertEquals(undefined, paramFoo.setValue(10));
  assertEquals(10, paramFoo.getValue());
  paramFoo.setValue(parseFloat('3.14159265358979323846'));
  // this is the closest that floating point can represent pi:
  assertEquals(3.14159265358979311600, paramFoo.getValue());
  assertEquals('3.141592653589793', String(paramFoo.getValue()));
  assertRoughlyEquals(Math.PI, paramFoo.getValue(), 1e-15);
  assertEquals(0, paramFoo.getLowerLimit());
  assertEquals(Util.POSITIVE_INFINITY, paramFoo.getUpperLimit());
  // test making a param from a name with an underbar in it, here 'foo_barness'
  var paramFooBar = new ParameterNumber(mockSubj2, MockSubject2.FOOBARNESS,
      MockSubject2.FOOBARNESS,
      goog.bind(mockSubj2.getFooBarness, mockSubj2),
      goog.bind(mockSubj2.setFooBarness, mockSubj2));
  mockSubj2.addParameter(paramFooBar);
  assertEquals(Util.toName(MockSubject2.FOOBARNESS), paramFooBar.getName());
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  assertEquals(0, paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(10));
  assertEquals(10, paramFooBar.getValue());
  assertEquals(paramFooBar, mockSubj2.getParameterNumber(MockSubject2.FOOBARNESS));
};
goog.exportProperty(window, 'testParameterNumber2', testParameterNumber2);

var testParameterNumber3 = function() {
  var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
  var Util = myphysicslab.lab.util.Util;
  /**
  @constructor
  @extends {myphysicslab.lab.util.AbstractSubject}
  */
  var MockSubject3 = function() {
    myphysicslab.lab.util.AbstractSubject.call(this, 'MOCK');
    /**
    * @type {number}
    * @private
    */
    this.fooness_ = 0;
    /**
    * @type {number}
    * @private
    */
    this.fooBarness_ = 0;
  };
  goog.inherits(MockSubject3, myphysicslab.lab.util.AbstractSubject);

  MockSubject3.FOONESS = 'FOONESS';
  MockSubject3.FOOBARNESS = 'FOO_BARNESS';
  /** @inheritDoc */
  MockSubject3.prototype.getClassName = function() {
    return 'MockSubject3';
  };
  /**
  @return {number}
  */
  MockSubject3.prototype.getFooness = function() {
    return this.fooness_;
  };
  /**
  @param {number} value
  */
  MockSubject3.prototype.setFooness = function(value) {
    this.fooness_ = value;
  };
  /**
  @return {number}
  */
  MockSubject3.prototype.getFooBarness = function() {
    return this.fooBarness_;
  };
  /**
  @param {number} value
  */
  MockSubject3.prototype.setFooBarness = function(value) {
    this.fooBarness_ = value;
  };
  var mockSubj3 = new MockSubject3();
  assertEquals(0, mockSubj3.getFooness());
  assertEquals(0, mockSubj3.getFooBarness());
  // now make parameters
  var paramFoo = new ParameterNumber(mockSubj3, MockSubject3.FOONESS,
      MockSubject3.FOONESS,
      goog.bind(mockSubj3.getFooness, mockSubj3),
      goog.bind(mockSubj3.setFooness, mockSubj3));
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
  assertEquals(Util.POSITIVE_INFINITY, paramFoo.getUpperLimit());
  // test making a param from a name with an underbar in it, here 'foo_barness'
  var paramFooBar = new ParameterNumber(mockSubj3, MockSubject3.FOOBARNESS,
      MockSubject3.FOOBARNESS,
      goog.bind(mockSubj3.getFooBarness, mockSubj3),
      goog.bind(mockSubj3.setFooBarness, mockSubj3));
  assertEquals(MockSubject3.FOOBARNESS, paramFooBar.getName());
  assertEquals(mockSubj3, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  assertEquals(0, paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(10));
  assertEquals(10, paramFooBar.getValue());
};
goog.exportProperty(window, 'testParameterNumber3', testParameterNumber3);

// ParameterNumber with array of choices and values
var testParameterNumber4 = function() {
  var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
  var Util = myphysicslab.lab.util.Util;
  /**
  @constructor
  @extends {myphysicslab.lab.util.AbstractSubject}
  */
  var MockSubject2 = function() {
    myphysicslab.lab.util.AbstractSubject.call(this, 'MOCK');
    /**
    * @type {number}
    * @private
    */
    this.fooness_ = 0.1;
    /**
    * @type {number}
    * @private
    */
    this.fooBarness_ = 1000000;
    /**
    * @type {number}
    * @private
    */
    this.baz_ = 0;
  };
  goog.inherits(MockSubject2, myphysicslab.lab.util.AbstractSubject);

  MockSubject2.FOONESS = 'FOONESS';
  MockSubject2.FOOBARNESS = 'FOO_BARNESS';
  MockSubject2.BAZ = 'BAZ';
  /** @inheritDoc */
  MockSubject2.prototype.getClassName = function() {
    return 'MockSubject2';
  };
  /**
  @return {number}
  */
  MockSubject2.prototype.getFooness = function() {
    return this.fooness_;
  };
  /**
  @param {number} value
  */
  MockSubject2.prototype.setFooness = function(value) {
    this.fooness_ = value;
  };
  /**
  @return {number}
  */
  MockSubject2.prototype.getFooBarness = function() {
    return this.fooBarness_;
  };
  /**
  @param {number} value
  */
  MockSubject2.prototype.setFooBarness = function(value) {
    this.fooBarness_ = value;
  };
  /**
  @return {number}
  */
  MockSubject2.prototype.getBaz = function() {
    return this.baz_;
  };
  /**
  @param {number} value
  */
  MockSubject2.prototype.setBaz = function(value) {
    this.baz_ = value;
  };
  /** @type {!MockSubject2} */
  var mockSubj2 = new MockSubject2();

  // make a parameter with choices and non-integer values
  var pi = Math.PI; //3.141592653589793;
  var e = Math.E; //2.718281828459045;
  var sqrt2 = Math.sqrt(2); //1.4142135623730951;
  var paramFooness = new ParameterNumber(mockSubj2, MockSubject2.FOONESS,
      MockSubject2.FOONESS,
      goog.bind(mockSubj2.getFooness, mockSubj2),
      goog.bind(mockSubj2.setFooness, mockSubj2),
    ['pi', 'e', 'sqrt(2)'], [pi, e, sqrt2]);
  mockSubj2.addParameter(paramFooness);
  assertEquals(MockSubject2.FOONESS, paramFooness.getName());
  assertEquals(mockSubj2, paramFooness.getSubject());
  assertTrue(paramFooness instanceof ParameterNumber);
  // we can start with a non-allowed value
  assertRoughlyEquals(0.1, paramFooness.getValue(), 1E-15);
  // set to a non-allowed value
  assertThrows(function() { paramFooness.setValue(10); });
  assertRoughlyEquals(0.1, paramFooness.getValue(), 1E-15);
  assertEquals(paramFooness, mockSubj2.getParameter(MockSubject2.FOONESS));
  assertEquals(paramFooness, mockSubj2.getParameterNumber(MockSubject2.FOONESS));
  assertThrows(function() { mockSubj2.getParameterString(MockSubject2.FOONESS) });
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.FOONESS) });
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
  var paramFooBar = new ParameterNumber(mockSubj2, MockSubject2.FOOBARNESS,
      MockSubject2.FOOBARNESS,
      goog.bind(mockSubj2.getFooBarness, mockSubj2),
      goog.bind(mockSubj2.setFooBarness, mockSubj2),
      ['none', 'some', 'lots'], [0, 5, 1000]);
  mockSubj2.addParameter(paramFooBar);
  assertEquals(MockSubject2.FOOBARNESS, paramFooBar.getName());
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterNumber);
  // we can start with a non-allowed value
  assertEquals(1000000, paramFooBar.getValue());
  // set to a non-allowed value
  assertThrows(function() { paramFooBar.setValue(10); });
  assertEquals(1000000, paramFooBar.getValue());
  assertEquals(paramFooBar, mockSubj2.getParameterNumber(MockSubject2.FOOBARNESS));
  assertThrows(function() { mockSubj2.getParameterString(MockSubject2.FOONESS) });
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.FOONESS) });
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
  var bazChoices = ['red', 'green', 'blue', 'black'];
  var paramBaz = new ParameterNumber(mockSubj2, MockSubject2.BAZ,
      MockSubject2.BAZ,
      goog.bind(mockSubj2.getBaz, mockSubj2),
      goog.bind(mockSubj2.setBaz, mockSubj2),
      bazChoices, goog.array.range(bazChoices.length)
      );
  mockSubj2.addParameter(paramBaz);
  assertEquals(MockSubject2.BAZ, paramBaz.getName());
  assertEquals(mockSubj2, paramBaz.getSubject());
  assertTrue(paramBaz instanceof ParameterNumber);
  assertEquals(0, paramBaz.getValue());
  // set to a non-allowed value
  assertThrows(function() { paramBaz.setValue(10); });
  assertEquals(0, paramBaz.getValue());
  assertEquals(paramBaz, mockSubj2.getParameterNumber(MockSubject2.BAZ));
  assertThrows(function() { mockSubj2.getParameterString(MockSubject2.BAZ) });
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.BAZ) });
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
  assertThrows( function() {
      new ParameterNumber(mockSubj2, MockSubject2.FOOBARNESS,
      MockSubject2.FOOBARNESS,
      goog.bind(mockSubj2.getFooBarness, mockSubj2),
      goog.bind(mockSubj2.setFooBarness, mockSubj2),
      ['none', 'some', 'lots', 'too many'], [0, 5, 1000]);
  });
};
goog.exportProperty(window, 'testParameterNumber4', testParameterNumber4);

