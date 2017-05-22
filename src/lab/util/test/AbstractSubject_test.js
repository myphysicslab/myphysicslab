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

goog.provide('myphysicslab.lab.util.test.AbstractSubject_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('goog.testing.jsunit');

var testAbstractSubject1 = function() {
  var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
  var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
  var ParameterString = myphysicslab.lab.util.ParameterString;
  var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
  var GenericEvent = myphysicslab.lab.util.GenericEvent;
  /**
  @constructor
  @extends {myphysicslab.lab.util.AbstractSubject}
  */
  var MockSubject1 = function() {
    AbstractSubject.call(this, 'MOCK');
    /**
    * @type {number}
    * @private
    */
    this.fooness_ = 0;
    /**
    * @type {boolean}
    * @private
    */
    this.fooBarness_ = false;
    /**
    * @type {string}
    * @private
    */
    this.qux_ = 'corge';
  };
  goog.inherits(MockSubject1, AbstractSubject);

  MockSubject1.FOONESS = 'FOONESS';
  MockSubject1.FOOBARNESS = 'FOO_BARNESS';
  MockSubject1.QUX = 'QUX';
  /** @inheritDoc */
  MockSubject1.prototype.getClassName = function() {
    return 'MockSubject1';
  };
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
  @return {boolean}
  */
  MockSubject1.prototype.getFooBarness = function() {
    return this.fooBarness_;
  };
  /**
  @param {boolean} value
  */
  MockSubject1.prototype.setFooBarness = function(value) {
    this.fooBarness_ = value;
  };
  /**
  @return {string}
  */
  MockSubject1.prototype.getQux = function() {
    return this.qux_;
  };
  /**
  @param {string} value
  */
  MockSubject1.prototype.setQux = function(value) {
    this.qux_ = value;
  };

  var mockSubj1 = new MockSubject1();
  assertEquals(0, mockSubj1.getFooness());
  assertFalse(mockSubj1.getFooBarness());
  assertEquals('corge', mockSubj1.getQux());

  // make parameters
  var paramFoo = new ParameterNumber(mockSubj1,
      MockSubject1.FOONESS,
      MockSubject1.FOONESS,
      goog.bind(mockSubj1.getFooness, mockSubj1),
      goog.bind(mockSubj1.setFooness, mockSubj1));
  mockSubj1.addParameter(paramFoo);
  assertEquals(0, paramFoo.getValue());

  var paramFooBar = new ParameterBoolean(mockSubj1, MockSubject1.FOOBARNESS,
      MockSubject1.FOOBARNESS,
      goog.bind(mockSubj1.getFooBarness, mockSubj1),
      goog.bind(mockSubj1.setFooBarness, mockSubj1));
  mockSubj1.addParameter(paramFooBar);
  assertFalse(paramFooBar.getValue());

  var paramQux = new ParameterString(mockSubj1,
      MockSubject1.QUX,
      MockSubject1.QUX,
      goog.bind(mockSubj1.getQux, mockSubj1),
      goog.bind(mockSubj1.setQux, mockSubj1));
  mockSubj1.addParameter(paramQux);
  assertEquals('corge', paramQux.getValue());

  // get parameters by name
  assertEquals(paramFoo, mockSubj1.getParameter(MockSubject1.FOONESS));
  assertEquals(paramFoo, mockSubj1.getParameterNumber(MockSubject1.FOONESS));
  assertThrows(function() { mockSubj1.getParameterBoolean(MockSubject1.FOONESS) });
  assertThrows(function() { mockSubj1.getParameterString(MockSubject1.FOONESS) });

  assertEquals(paramFooBar, mockSubj1.getParameter(MockSubject1.FOOBARNESS));
  assertEquals(paramFooBar, mockSubj1.getParameterBoolean(MockSubject1.FOOBARNESS));
  assertThrows(function() { mockSubj1.getParameterNumber(MockSubject1.FOOBARNESS) });
  assertThrows(function() { mockSubj1.getParameterString(MockSubject1.FOOBARNESS) });

  assertEquals(paramQux, mockSubj1.getParameter(MockSubject1.QUX));
  assertEquals(paramQux, mockSubj1.getParameterString(MockSubject1.QUX));
  assertThrows(function() { mockSubj1.getParameterNumber(MockSubject1.QUX) });
  assertThrows(function() { mockSubj1.getParameterBoolean(MockSubject1.QUX) });

  // ask for non-existant parameter
  assertThrows(function() { mockSubj1.getParameter('BLARG') });
  assertThrows(function() { mockSubj1.getParameterNumber('BLARG') });

  /** @type {!Array<!myphysicslab.lab.util.Parameter>} */
  var params = mockSubj1.getParameters();
  assertEquals(3, params.length);
  assertTrue(goog.array.contains(params, paramFoo));
  assertTrue(goog.array.contains(params, paramFooBar));
  assertTrue(goog.array.contains(params, paramQux));
  /**  Observer that counts number of times that parameters are changed or events fire.
  @constructor
  @implements {myphysicslab.lab.util.Observer}
  */
  var MockObserver1 = function() {
    /**
    * @type {number}
    */
    this.numEvents = 0;
    /**
    * @type {number}
    */
    this.numBooleans = 0;
    /**
    * @type {number}
    */
    this.numDoubles = 0;
    /**
    * @type {number}
    */
    this.numStrings = 0;
  };
  MockObserver1.prototype.observe =  function(event) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      assertEquals('FOOEVENT', event.getName());
      assertTrue(event.nameEquals('fooevent'));
      assertTrue(event instanceof GenericEvent);
      assertEquals(mockSubj1, event.getSubject());
    } else if (event instanceof ParameterBoolean) {
      this.numBooleans++;
      assertEquals('FOO_BARNESS', event.getName());
      assertTrue(event.nameEquals('foo-barness'));
      assertTrue(event instanceof ParameterBoolean);
      assertEquals(mockSubj1, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isBoolean(val));
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
      assertEquals('FOONESS', event.getName());
      assertTrue(event.nameEquals('fooness'));
      assertTrue(event instanceof ParameterNumber);
      assertEquals(mockSubj1, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isNumber(val));
    } else if (event instanceof ParameterString) {
      this.numStrings++;
      assertEquals('QUX', event.getName());
      assertTrue(event.nameEquals('qux'));
      assertTrue(event instanceof ParameterString);
      assertEquals(mockSubj1, event.getSubject());
      assertTrue(goog.isString(event.getValue()));
    }
  };
  MockObserver1.prototype.toStringShort = function() {
    return 'MockObserver1';
  };
  var mockObsvr1 = new MockObserver1();
  assertEquals(0, mockObsvr1.numEvents);
  assertEquals(0, mockObsvr1.numBooleans);
  assertEquals(0, mockObsvr1.numDoubles);
  assertEquals(0, mockObsvr1.numStrings);
  // add the observer to the subject
  mockSubj1.addObserver(mockObsvr1);
  // there should be only this one observer
  /** @type {!Array<!myphysicslab.lab.util.Observer>} */
  var obsvrs = mockSubj1.getObservers();
  assertEquals(1, obsvrs.length);
  assertTrue(goog.array.contains(obsvrs, mockObsvr1));
  var event1 = new GenericEvent(mockSubj1, 'fooEvent');
  // broadcast an event, the mock observer should see it
  event1.getSubject().broadcast(event1);
  assertEquals(1, mockObsvr1.numEvents);
  mockSubj1.broadcast(event1);
  assertEquals(2, mockObsvr1.numEvents);
  // broadcast a parameter, which mock observer should see
  paramFoo.getSubject().broadcast(paramFoo);
  assertEquals(1, mockObsvr1.numDoubles);
  // broadcast by parameter name
  mockSubj1.broadcastParameter(MockSubject1.FOOBARNESS);
  assertEquals(1, mockObsvr1.numBooleans);
  paramFooBar.setValue(!paramFooBar.getValue());
  paramFooBar.getSubject().broadcast(paramFooBar);
  assertEquals(2, mockObsvr1.numBooleans);
  paramFooBar.setValue(!paramFooBar.getValue());
  mockSubj1.broadcast(paramFooBar);
  assertEquals(3, mockObsvr1.numBooleans);
  // broadcast the string parameter
  mockSubj1.broadcast(paramQux);
  assertEquals(1, mockObsvr1.numStrings);
  paramQux.setValue('grault');
  paramQux.getSubject().broadcast(paramQux);
  assertEquals(2, mockObsvr1.numStrings);
  paramQux.setValue('blarg');
  mockSubj1.broadcastParameter(MockSubject1.QUX);
  assertEquals(3, mockObsvr1.numStrings);
  // remove the observer
  mockSubj1.removeObserver(mockObsvr1);
  assertEquals(0, mockSubj1.getObservers().length);
  mockSubj1.broadcastParameter(MockSubject1.FOOBARNESS);
  // mockObsvr1 should be unchanged
  assertEquals(3, mockObsvr1.numBooleans);

  /**  Observer that counts number of times that parameters are changed or events fire.
  @constructor
  @implements {myphysicslab.lab.util.Observer}
  */
  var MockObserver2 = function() {
    /**
    * @type {number}
    */
    this.numEvents = 0;
    /**
    * @type {number}
    */
    this.numBooleans = 0;
    /**
    * @type {number}
    */
    this.numDoubles = 0;
    /**
    * @type {number}
    */
    this.numStrings = 0;
  };
  MockObserver2.prototype.observe =  function(event) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      assertEquals('FOOEVENT', event.getName());
      assertTrue(event.nameEquals('fooevent'));
      assertTrue(event instanceof GenericEvent);
      assertEquals(mockSubj1, event.getSubject());
    } else if (event instanceof ParameterBoolean) {
      // remove myself from observer list
      mockSubj1.removeObserver(this);
      this.numBooleans++;
      assertEquals('FOO_BARNESS', event.getName());
      assertTrue(event.nameEquals('foo-barness'));
      assertTrue(event instanceof ParameterBoolean);
      assertEquals(mockSubj1, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isBoolean(val));
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
      assertEquals('FOONESS', event.getName());
      assertTrue(event.nameEquals('fooness'));
      assertTrue(event instanceof ParameterNumber);
      assertEquals(mockSubj1, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isNumber(val));
    } else if (event instanceof ParameterString) {
      this.numStrings++;
      assertEquals('QUX', event.getName());
      assertTrue(event.nameEquals('qux'));
      assertTrue(event instanceof ParameterString);
      assertEquals(mockSubj1, event.getSubject());
      assertTrue(goog.isString(event.getValue()));
    }
  };
  MockObserver2.prototype.toStringShort = function() {
    return 'MockObserver2';
  };

  // make a second observer, to test the claim that
  // "you can do removeObserver() during observe()"
  var mockObsvr2 = new MockObserver2();
  mockSubj1.addObserver(mockObsvr2);
  mockSubj1.addObserver(mockObsvr1);
  assertEquals(2, mockSubj1.getObservers().length);
  // broadcast a parameter, which both observers should see
  paramFoo.getSubject().broadcast(paramFoo);
  assertEquals(1, mockObsvr2.numDoubles);
  assertEquals(2, mockObsvr1.numDoubles);
  // broadcast a parameter that causes mockObsvr2 to remove itself
  mockSubj1.broadcastParameter(MockSubject1.FOOBARNESS);
  // both observers should increase by one
  assertEquals(1, mockObsvr2.numBooleans);
  assertEquals(4, mockObsvr1.numBooleans);
  obsvrs = mockSubj1.getObservers();
  assertEquals(1, obsvrs.length);
  assertFalse(goog.array.contains(obsvrs, mockObsvr2));
  assertTrue(goog.array.contains(obsvrs, mockObsvr1));
};
goog.exportProperty(window, 'testAbstractSubject1', testAbstractSubject1);
