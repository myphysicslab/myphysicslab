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
import { Observer, GenericEvent, ParameterBoolean, ParameterNumber,
    ParameterString, SubjectEvent } from "../Observe.js";
import { AbstractSubject } from "../AbstractSubject.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testAbstractSubject1);
};

const groupName = 'AbstractSubjectTest.';

function testAbstractSubject1() {
  startTest(groupName+'testAbstractSubject1');
  const mockSubj1 = new MockSubject1();
  assertEquals(0, mockSubj1.getFooness());
  assertFalse(mockSubj1.getFooBarness());
  assertEquals('corge', mockSubj1.getQux());

  // make parameters
  const paramFoo = new ParameterNumber(mockSubj1,
      FOONESS,
      FOONESS,
      () => mockSubj1.getFooness(),
      (a: number) => mockSubj1.setFooness(a));
  mockSubj1.addParameter(paramFoo);
  assertEquals(0, paramFoo.getValue());

  const paramFooBar = new ParameterBoolean(mockSubj1, FOOBARNESS,
      FOOBARNESS,
      () => mockSubj1.getFooBarness(),
      (a: boolean) => mockSubj1.setFooBarness(a));
  mockSubj1.addParameter(paramFooBar);
  assertFalse(paramFooBar.getValue());

  const paramQux = new ParameterString(mockSubj1,
      QUX,
      QUX,
      () => mockSubj1.getQux(),
      (a: string) => mockSubj1.setQux(a));
  mockSubj1.addParameter(paramQux);
  assertEquals('corge', paramQux.getValue());

  // get parameters by name
  assertEquals(paramFoo, mockSubj1.getParameter(FOONESS));
  assertEquals(paramFoo, mockSubj1.getParameterNumber(FOONESS));
  assertThrows(()=>  mockSubj1.getParameterBoolean(FOONESS) );
  assertThrows(()=>  mockSubj1.getParameterString(FOONESS) );

  assertEquals(paramFooBar, mockSubj1.getParameter(FOOBARNESS));
  assertEquals(paramFooBar, mockSubj1.getParameterBoolean(FOOBARNESS));
  assertThrows(()=>  mockSubj1.getParameterNumber(FOOBARNESS) );
  assertThrows(()=>  mockSubj1.getParameterString(FOOBARNESS) );

  assertEquals(paramQux, mockSubj1.getParameter(QUX));
  assertEquals(paramQux, mockSubj1.getParameterString(QUX));
  assertThrows(()=>  mockSubj1.getParameterNumber(QUX) );
  assertThrows(()=>  mockSubj1.getParameterBoolean(QUX) );

  // ask for non-existant parameter
  assertThrows(()=>  mockSubj1.getParameter('BLARG') );
  assertThrows(()=>  mockSubj1.getParameterNumber('BLARG') );

  const params = mockSubj1.getParameters();
  assertEquals(3, params.length);
  assertTrue(params.includes(paramFoo));
  assertTrue(params.includes(paramFooBar));
  assertTrue(params.includes(paramQux));
  const mockObsvr1 = new MockObserver1(mockSubj1);
  assertEquals(0, mockObsvr1.numEvents);
  assertEquals(0, mockObsvr1.numBooleans);
  assertEquals(0, mockObsvr1.numDoubles);
  assertEquals(0, mockObsvr1.numStrings);
  // add the observer to the subject
  mockSubj1.addObserver(mockObsvr1);
  // there should be only this one observer
  const obsvrs = mockSubj1.getObservers();
  assertEquals(1, obsvrs.length);
  assertTrue(obsvrs.includes(mockObsvr1));
  const event1 = new GenericEvent(mockSubj1, 'fooEvent');
  // broadcast an event, the mock observer should see it
  event1.getSubject().broadcast(event1);
  assertEquals(1, mockObsvr1.numEvents);
  mockSubj1.broadcast(event1);
  assertEquals(2, mockObsvr1.numEvents);
  // broadcast a parameter, which mock observer should see
  paramFoo.getSubject().broadcast(paramFoo);
  assertEquals(1, mockObsvr1.numDoubles);
  // broadcast by parameter name
  mockSubj1.broadcastParameter(FOOBARNESS);
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
  mockSubj1.broadcastParameter(QUX);
  assertEquals(3, mockObsvr1.numStrings);
  // remove the observer
  mockSubj1.removeObserver(mockObsvr1);
  assertEquals(0, mockSubj1.getObservers().length);
  mockSubj1.broadcastParameter(FOOBARNESS);
  // mockObsvr1 should be unchanged
  assertEquals(3, mockObsvr1.numBooleans);

  // make a second observer, to test the claim that
  // "you can do removeObserver() during observe()"
  const mockObsvr2 = new MockObserver2(mockSubj1);
  mockSubj1.addObserver(mockObsvr2);
  mockSubj1.addObserver(mockObsvr1);
  assertEquals(2, mockSubj1.getObservers().length);
  // broadcast a parameter, which both observers should see
  paramFoo.getSubject().broadcast(paramFoo);
  assertEquals(1, mockObsvr2.numDoubles);
  assertEquals(2, mockObsvr1.numDoubles);
  // broadcast a parameter that causes mockObsvr2 to remove itself
  mockSubj1.broadcastParameter(FOOBARNESS);
  // both observers should increase by one
  assertEquals(1, mockObsvr2.numBooleans);
  assertEquals(4, mockObsvr1.numBooleans);
  const obsvrs2 = mockSubj1.getObservers();
  assertEquals(1, obsvrs2.length);
  assertFalse(obsvrs.includes(mockObsvr2));
  assertTrue(obsvrs.includes(mockObsvr1));
};


class MockSubject1 extends AbstractSubject {
    fooness_ = 0;
    fooBarness_ = false;
    qux_ = 'corge';

  constructor() {
    super('MOCK');
  };

  getClassName() {
    return 'MockSubject1';
  };
  getFooness() {
    return this.fooness_;
  };
  setFooness(value: number): void {
    this.fooness_ = value;
  };
  getFooBarness(): boolean {
    return this.fooBarness_;
  };
  setFooBarness(value: boolean): void {
    this.fooBarness_ = value;
  };
  getQux(): string {
    return this.qux_;
  };
  setQux(value: string): void {
    this.qux_ = value;
  };
} // end class
const FOONESS = 'FOONESS';
const FOOBARNESS = 'FOO_BARNESS';
const QUX = 'QUX';


/**  Observer that counts number of times that parameters are changed or events fire.
*/
class MockObserver1 implements Observer {
    numEvents: number = 0;
    numBooleans: number = 0;
    numDoubles: number = 0;
    numStrings: number = 0;
    mockSubj1: MockSubject1;

  constructor(mockSubj1: MockSubject1) {
    this.mockSubj1 = mockSubj1;
  };
  observe(event: SubjectEvent) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      assertEquals('FOOEVENT', event.getName());
      assertTrue(event.nameEquals('fooevent'));
      assertTrue(event instanceof GenericEvent);
      assertEquals(this.mockSubj1, event.getSubject());
    } else if (event instanceof ParameterBoolean) {
      this.numBooleans++;
      assertEquals('FOO_BARNESS', event.getName());
      assertTrue(event.nameEquals('foo-barness'));
      assertTrue(event instanceof ParameterBoolean);
      assertEquals(this.mockSubj1, event.getSubject());
      var bval = event.getValue();
      assertTrue(typeof bval === 'boolean');
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
      assertEquals('FOONESS', event.getName());
      assertTrue(event.nameEquals('fooness'));
      assertTrue(event instanceof ParameterNumber);
      assertEquals(this.mockSubj1, event.getSubject());
      var nval = event.getValue();
      assertTrue(typeof nval === 'number');
    } else if (event instanceof ParameterString) {
      this.numStrings++;
      assertEquals('QUX', event.getName());
      assertTrue(event.nameEquals('qux'));
      assertTrue(event instanceof ParameterString);
      assertEquals(this.mockSubj1, event.getSubject());
      assertTrue(typeof event.getValue() === 'string');
    }
  };
  toStringShort() {
    return 'MockObserver1';
  };
} // end class

/**  Observer that counts number of times that parameters are changed or events fire.
*/
class MockObserver2 implements Observer {
    numEvents: number = 0;
    numBooleans: number = 0;
    numDoubles: number = 0;
    numStrings: number = 0;
    mockSubj1: MockSubject1;

  constructor(mockSubj1: MockSubject1) {
    this.mockSubj1 = mockSubj1;
  };
  observe(event: SubjectEvent) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      assertEquals('FOOEVENT', event.getName());
      assertTrue(event.nameEquals('fooevent'));
      assertTrue(event instanceof GenericEvent);
      assertEquals(this.mockSubj1, event.getSubject());
    } else if (event instanceof ParameterBoolean) {
      // remove myself from observer list
      this.mockSubj1.removeObserver(this);
      this.numBooleans++;
      assertEquals('FOO_BARNESS', event.getName());
      assertTrue(event.nameEquals('foo-barness'));
      assertTrue(event instanceof ParameterBoolean);
      assertEquals(this.mockSubj1, event.getSubject());
      var bval = event.getValue();
      assertTrue(typeof bval === 'boolean');
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
      assertEquals('FOONESS', event.getName());
      assertTrue(event.nameEquals('fooness'));
      assertTrue(event instanceof ParameterNumber);
      assertEquals(this.mockSubj1, event.getSubject());
      var nval = event.getValue();
      assertTrue(typeof nval === 'number');
    } else if (event instanceof ParameterString) {
      this.numStrings++;
      assertEquals('QUX', event.getName());
      assertTrue(event.nameEquals('qux'));
      assertTrue(event instanceof ParameterString);
      assertEquals(this.mockSubj1, event.getSubject());
      assertTrue(typeof event.getValue() === 'string');
    }
  };
  toStringShort() {
    return 'MockObserver2';
  };
} // end class
