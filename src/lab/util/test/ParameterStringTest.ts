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
import { ParameterString } from "../Observe.js";
import { AbstractSubject } from "../AbstractSubject.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testParameterString1);
};

const groupName = 'ParameterStringTest.';

function testParameterString1() {
  startTest(groupName+'testParameterString1');
  const mockSubj2 = new MockSubject2();
  assertEquals('foo', mockSubj2.getFooness());
  assertEquals('none', mockSubj2.getFooBarness());
  // make parameters
  const paramFoo = new ParameterString(mockSubj2, FOONESS,
      FOONESS,
      () => mockSubj2.getFooness(),
      a => mockSubj2.setFooness(a));
  mockSubj2.addParameter(paramFoo);
  assertEquals(Util.toName(FOONESS), paramFoo.getName());
  assertTrue(paramFoo.nameEquals(FOONESS));
  assertEquals(mockSubj2, paramFoo.getSubject());
  assertTrue(paramFoo instanceof ParameterString);
  assertEquals(paramFoo, mockSubj2.getParameterString(FOONESS));
  assertThrows(()=>  mockSubj2.getParameterNumber(FOONESS) );
  assertThrows(()=>  mockSubj2.getParameterBoolean(FOONESS) );
  assertEquals('foo', paramFoo.getValue());
  assertEquals(undefined, paramFoo.setValue('baz'));
  assertEquals('baz', paramFoo.getValue());
  paramFoo.setValue('qux');
  assertEquals('qux', paramFoo.getValue());
  assertEquals(20, paramFoo.getSuggestedLength());
  assertEquals(paramFoo, paramFoo.setSuggestedLength(10));
  assertEquals(10, paramFoo.getSuggestedLength());
  assertEquals(Infinity, paramFoo.getMaxLength());
  // can't set max length to less than length of current string value
  assertThrows(() => paramFoo.setMaxLength(2));
  assertEquals(paramFoo, paramFoo.setMaxLength(10));
  assertEquals(10, paramFoo.getMaxLength());
  assertThrows(() => paramFoo.setValue('very long string'));
  assertEquals(undefined, paramFoo.setValue('grault'));
  assertEquals('grault', paramFoo.getValue());
  paramFoo.setFromString('blarg');
  assertEquals('blarg', paramFoo.getValue());

  // make a parameter with choices
  const paramFooBar = new ParameterString(mockSubj2, FOOBARNESS,
      FOOBARNESS,
      () => mockSubj2.getFooBarness(),
      a => mockSubj2.setFooBarness(a),
    ['keine', 'manche', 'viele'], ['none', 'some', 'many']);
  mockSubj2.addParameter(paramFooBar);
  assertEquals(Util.toName(FOOBARNESS), paramFooBar.getName());
  assertTrue(paramFooBar.nameEquals(FOOBARNESS));
  assertEquals(mockSubj2, paramFooBar.getSubject());
  assertTrue(paramFooBar instanceof ParameterString);
  assertEquals('none', paramFooBar.getValue());
  // set to a non-allowed value
  assertThrows(() => paramFooBar.setValue('any'));
  assertEquals('none', paramFooBar.getValue());
  // find param by its name
  assertEquals(paramFooBar, mockSubj2.getParameterString(FOOBARNESS));
  assertThrows(()=>  mockSubj2.getParameterNumber(FOOBARNESS) );
  assertThrows(()=>  mockSubj2.getParameterBoolean(FOOBARNESS) );
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

class MockSubject2 extends AbstractSubject {
    fooness_ = 'foo';
    fooBarness_ = 'none';
  constructor() {
    super('MOCK');
  };
  getClassName() {
    return 'MockSubject2';
  };
  getFooness(): string {
    return this.fooness_;
  };
  setFooness(value: string) {
    this.fooness_ = value;
  };
  getFooBarness(): string {
    return this.fooBarness_;
  };
  setFooBarness(value: string) {
    this.fooBarness_ = value;
  };
} // end class

const FOONESS = 'fooness';
const FOOBARNESS = 'foo-barness';
