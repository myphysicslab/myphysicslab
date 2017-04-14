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

goog.provide('myphysicslab.lab.util.test.ParameterBoolean_test');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('goog.testing.jsunit');

var testParameterBoolean1 = function() {
  var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var AbstractSubject = myphysicslab.lab.util.AbstractSubject;

  /**
  @constructor
  @extends {myphysicslab.lab.util.AbstractSubject}
  */
  var MockSubject1 = function() {
    AbstractSubject.call(this, 'MOCK');
    /**
    * @type {boolean}
    * @private
    */
    this.fooness_ = false;
    /**
    * @type {boolean}
    * @private
    */
    this.fooBarness_ = true;
  };
  goog.inherits(MockSubject1, AbstractSubject);

  MockSubject1.FOONESS = 'FOONESS';
  MockSubject1.FOOBARNESS = 'FOO_BARNESS';
  /** @inheritDoc */
  MockSubject1.prototype.getClassName = function() {
    return 'MockSubject1';
  };
  /**
  @return {boolean}
  */
  MockSubject1.prototype.getFooness = function() {
    return this.fooness_;
  };
  /**
  @param {boolean} value
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
  var mockSubj1 = new MockSubject1();
  assertFalse(mockSubj1.getFooness());
  assertTrue(mockSubj1.getFooBarness());
  // now make parameters
  var paramFoo = new ParameterBoolean(mockSubj1, MockSubject1.FOONESS,
      MockSubject1.FOONESS,
      goog.bind(mockSubj1.getFooness, mockSubj1),
      goog.bind(mockSubj1.setFooness, mockSubj1));
  mockSubj1.addParameter(paramFoo);
  assertEquals('FOONESS', paramFoo.getName());
  assertTrue(paramFoo.nameEquals('fooness'));
  assertEquals(mockSubj1, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterBoolean);
  assertEquals(paramFoo, mockSubj1.getParameterBoolean(MockSubject1.FOONESS));
  assertFalse(paramFoo.getValue());
  assertEquals('false', paramFoo.getAsString());
  assertEquals(undefined, paramFoo.setValue(true));
  assertTrue(paramFoo.getValue());
  assertEquals('true', paramFoo.getAsString());
  paramFoo.setValue(false);
  assertFalse(paramFoo.getValue());
  assertEquals(0, paramFoo.getValues().length);
  assertEquals(0, paramFoo.getChoices().length);
  paramFoo.setFromString('true');
  assertTrue(paramFoo.getValue());
  paramFoo.setFromString('false');
  assertFalse(paramFoo.getValue());
  // make a parameter with choices
  var paramFooBar = new ParameterBoolean(mockSubj1, MockSubject1.FOOBARNESS,
      MockSubject1.FOOBARNESS,
      goog.bind(mockSubj1.getFooBarness, mockSubj1),
      goog.bind(mockSubj1.setFooBarness, mockSubj1),
      ['on', 'off'], [true, false]);
  mockSubj1.addParameter(paramFooBar);
  assertEquals(MockSubject1.FOOBARNESS, paramFooBar.getName());
  assertEquals(mockSubj1, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterBoolean);
  assertEquals(paramFooBar, mockSubj1.getParameterBoolean(MockSubject1.FOOBARNESS));
  assertTrue(paramFooBar.getValue());
  assertEquals(undefined, paramFooBar.setValue(false));
  assertFalse(paramFooBar.getValue());
  paramFooBar.setValue(true);
  assertTrue(paramFooBar.getValue());
  // check the list of choices/values
  assertEquals('on', paramFooBar.getChoices()[0]);
  assertEquals('true', paramFooBar.getValues()[0]);
  paramFooBar.setValue(paramFooBar.getValues()[0] == 'true');
  assertTrue(paramFooBar.getValue());
  assertEquals('off', paramFooBar.getChoices()[1]);
  assertEquals('false', paramFooBar.getValues()[1]);
  paramFooBar.setValue(paramFooBar.getValues()[1] == 'true');
  assertFalse(paramFooBar.getValue());
  // remove parameters from subject
  mockSubj1.removeParameter(paramFoo);
  assertThrows(function() { mockSubj1.getParameterBoolean(MockSubject1.FOONESS) });
  mockSubj1.removeParameter(paramFooBar);
  assertThrows(function() { mockSubj1.getParameterBoolean(MockSubject1.FOOBARNESS) });
};
goog.exportProperty(window, 'testParameterBoolean1', testParameterBoolean1);

