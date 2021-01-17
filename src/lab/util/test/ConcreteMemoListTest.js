// Copyright 2017 Erik Neumann.  All Rights Reserved.
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

goog.module('myphysicslab.lab.util.test.ConcreteMemoListTest');

const ConcreteMemoList = goog.require('myphysicslab.lab.util.ConcreteMemoList');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const Util = goog.require('myphysicslab.lab.util.Util');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class ConcreteMemoListTest {

static test() {
  schedule(ConcreteMemoListTest.testConcreteMemoList1);
};

static testConcreteMemoList1() {
  startTest(ConcreteMemoListTest.groupName+'testConcreteMemoList1');
  const vec1 = new MutableVector(1, 1);
  const memVec1 = MutableVector.clone(vec1);
  const vec2 = new MutableVector(2, 2);
  const memVec2 = MutableVector.clone(vec2);
  const mem1 = new GenericMemo(() => memVec1.setToVector(vec1));
  const mem2 = new GenericMemo(() => memVec2.setToVector(vec2));
  const memList1 = new ConcreteMemoList();
  const memList2 = new ConcreteMemoList();
  memList1.addMemo(mem1);
  memList1.addMemo(memList2);
  memList2.addMemo(mem2);
  assertTrue(memVec1.equals(vec1));
  assertTrue(memVec2.equals(vec2));
  assertEquals(2, memList1.getMemos().length);
  assertEquals(1, memList2.getMemos().length);

  // modify the objects of interest, confirm they are memorized.
  vec1.setTo(-1, -1);
  vec2.setTo(-2, -2);
  memList1.memorize();
  assertTrue(memVec1.equals(vec1));
  assertTrue(memVec2.equals(vec2));

  // should not be able to add/remove memos within a memorize() method.
  const mem3 = new GenericMemo(() => memList1.removeMemo(mem1));
  memList2.addMemo(mem3);
  assertEquals(2, memList1.getMemos().length);
  assertEquals(2, memList2.getMemos().length);
  assertThrows(() => memList1.memorize());
  // remove the bad memo, confirm things still work
  memList2.removeMemo(mem3);
  vec1.setTo(10, 15);
  vec2.setTo(20, 30);
  memList1.memorize();
  assertTrue(memVec1.equals(vec1));
  assertTrue(memVec2.equals(vec2));

  // should not be able to add/remove memos within a memorize() method.
  const mem4 = new GenericMemo(() => memList2.addMemo(memList1));
  memList2.addMemo(mem4);
  assertThrows(() => memList1.memorize());
  // remove the bad memo, confirm things still work
  memList2.removeMemo(mem4);
  vec1.setTo(0.10, 0.15);
  vec2.setTo(0.20, 0.30);
  memList1.memorize();
  assertTrue(memVec1.equals(vec1));
  assertTrue(memVec2.equals(vec2));
};

} // end class

/**
* @type {string}
* @const
*/
ConcreteMemoListTest.groupName = 'ConcreteMemoListTest.';

exports = ConcreteMemoListTest;
