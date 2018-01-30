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

goog.module('myphysicslab.lab.util.test.ParameterString_test');

const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const Util = goog.require('myphysicslab.lab.util.Util');
goog.require('goog.testing.jsunit');

class MockSubject2 extends AbstractSubject {
  constructor() {
    super('MOCK');
    /**
    * @type {string}
    * @private
    */
    this.fooness_ = 'foo';
    /**
    * @type {string}
    * @private
    */
    this.fooBarness_ = 'none';
  };

  /** @override */
  getClassName() {
    return 'MockSubject2';
  };
  /**
  @return {string}
  */
  getFooness() {
    return this.fooness_;
  };
  /**
  @param {string} value
  */
  setFooness(value) {
    this.fooness_ = value;
  };
  /**
  @return {string}
  */
  getFooBarness() {
    return this.fooBarness_;
  };
  /**
  @param {string} value
  */
  setFooBarness(value) {
    this.fooBarness_ = value;
  };
} // end class
MockSubject2.FOONESS = 'fooness';
MockSubject2.FOOBARNESS = 'foo-barness';

var testParameterString1 = function() {
  /** @type {!MockSubject2} */
  var mockSubj2 = new MockSubject2();
  assertEquals('foo', mockSubj2.getFooness());
  assertEquals('none', mockSubj2.getFooBarness());
  // make parameters
  var paramFoo = new ParameterString(mockSubj2, MockSubject2.FOONESS,
      MockSubject2.FOONESS,
      goog.bind(mockSubj2.getFooness, mockSubj2),
      goog.bind(mockSubj2.setFooness, mockSubj2));
  mockSubj2.addParameter(paramFoo);
  assertEquals(Util.toName(MockSubject2.FOONESS), paramFoo.getName());
  assertTrue(paramFoo.nameEquals(MockSubject2.FOONESS));
  assertEquals(mockSubj2, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterString);
  assertEquals(paramFoo, mockSubj2.getParameterString(MockSubject2.FOONESS));
  assertThrows(function() { mockSubj2.getParameterNumber(MockSubject2.FOONESS) });
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.FOONESS) });
  assertEquals('foo', paramFoo.getValue());
  assertEquals(undefined, paramFoo.setValue('baz'));
  assertEquals('baz', paramFoo.getValue());
  paramFoo.setValue('qux');
  assertEquals('qux', paramFoo.getValue());
  assertEquals(20, paramFoo.getSuggestedLength());
  assertEquals(paramFoo, paramFoo.setSuggestedLength(10));
  assertEquals(10, paramFoo.getSuggestedLength());
  assertEquals(Util.POSITIVE_INFINITY, paramFoo.getMaxLength());
  // can't set max length to less than length of current string value
  assertThrows(function() { paramFoo.setMaxLength(2); });
  assertEquals(paramFoo, paramFoo.setMaxLength(10));
  assertEquals(10, paramFoo.getMaxLength());
  assertThrows(function() { paramFoo.setValue('very long string'); });
  assertEquals(undefined, paramFoo.setValue('grault'));
  assertEquals('grault', paramFoo.getValue());
  paramFoo.setFromString('blarg');
  assertEquals('blarg', paramFoo.getValue());

  // make a parameter with choices
  var paramFooBar = new ParameterString(mockSubj2, MockSubject2.FOOBARNESS,
      MockSubject2.FOOBARNESS,
      goog.bind(mockSubj2.getFooBarness, mockSubj2),
      goog.bind(mockSubj2.setFooBarness, mockSubj2),
    ['keine', 'manche', 'viele'], ['none', 'some', 'many']);
  mockSubj2.addParameter(paramFooBar);
  assertEquals(Util.toName(MockSubject2.FOOBARNESS), paramFooBar.getName());
  assertTrue(paramFooBar.nameEquals(MockSubject2.FOOBARNESS));
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterString);
  assertEquals('none', paramFooBar.getValue());
  // set to a non-allowed value
  assertThrows(function() { paramFooBar.setValue('any'); });
  assertEquals('none', paramFooBar.getValue());
  // find param by its name
  assertEquals(paramFooBar, mockSubj2.getParameterString(MockSubject2.FOOBARNESS));
  assertThrows(function() { mockSubj2.getParameterNumber(MockSubject2.FOOBARNESS) });
  assertThrows(function() { mockSubj2.getParameterBoolean(MockSubject2.FOOBARNESS) });
  paramFooBar.setValue('some');
  assertEquals('some', paramFooBar.getValue());

  // check the list of choices/values
  assertEquals(3, paramFooBar.getChoices().length);
  assertEquals(3, paramFooBar.getValues().length);

  assertEquals('keine', paramFooBar.getChoices()[0]);
  assertEquals('none', paramFooBar.getValues()[0]);
  paramFooBar.setValue(paramFooBar.getValues()[0]);
  assertEquals('none', paramFooBar.getValue());

  assertEquals('manche', paramFooBar.getChoices()[1]);
  assertEquals('some', paramFooBar.getValues()[1]);
  paramFooBar.setValue(paramFooBar.getValues()[1]);
  assertEquals('some', paramFooBar.getValue());

  assertEquals('viele', paramFooBar.getChoices()[2]);
  assertEquals('many', paramFooBar.getValues()[2]);
  paramFooBar.setValue(paramFooBar.getValues()[2]);
  assertEquals('many', paramFooBar.getValue());
};
goog.exportProperty(window, 'testParameterString1', testParameterString1);

