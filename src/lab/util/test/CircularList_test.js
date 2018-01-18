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

goog.provide('myphysicslab.lab.util.test.CircularList_test');

goog.require('myphysicslab.lab.util.HistoryList');
goog.require('myphysicslab.lab.util.HistoryIterator');
goog.require('myphysicslab.lab.util.CircularList');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Util');
goog.require('goog.testing.jsunit');

/*
  This test implements the following example:

  Example: Suppose capacity = 10. The list will fill in as shown below. The numbers are
  the index number returned by store(). The caret ^ indicates nextPtr_ -- the next
  slot to be written to.
                                  cycles
  .  .  .  .  .  .  .  .  .  .      0
  ^
  0  .  .  .  .  .  .  .  .  .      0
     ^
  0  1  .  .  .  .  .  .  .  .      0
        ^
  0  1  2  3  4  5  6  7  8  .      0
                             ^
  0  1  2  3  4  5  6  7  8  9      1
  ^
  10 1  2  3  4  5  6  7  8  9      1
     ^
  10 11 2  3  4  5  6  7  8  9      1
        ^
  10 11 12 13 14 15 16 17 18 9      1
                             ^
  10 11 12 13 14 15 16 17 18 19     2
  ^
  20 11 12 13 14 15 16 17 18 19     2
     ^
  20 21 12 13 14 15 16 17 18 19     2
        ^
*/
var testUtilCircularList1 = function() {
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  const HistoryList = goog.module.get('myphysicslab.lab.util.HistoryList');
  const HistoryIterator = goog.module.get('myphysicslab.lab.util.HistoryIterator');
  const CircularList = goog.module.get('myphysicslab.lab.util.CircularList');
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  /** @type {!HistoryList<!Vector>}*/
  var cList = new CircularList(10);
  var i, j;
  assertEquals(0, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(-1, cList.getEndIndex());
  assertNull(cList.getEndValue());
  /** @type {!HistoryIterator<!Vector>}*/
  var cIter = cList.getIterator();
  // no data yet, should throw exception
  assertFalse(cIter.hasNext());
  assertFalse(cIter.hasPrevious());
  assertThrows(function() { cIter.nextValue(); });
  assertThrows(function() { cIter.previousValue(); });
  assertThrows(function() { cIter.getIndex(); });

  // memorize first point
  j = cList.store(new Vector(0, 1));
  assertEquals(0, j);
  assertEquals(1, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(0, cList.getEndIndex());
  var endValue;
  assertNotNull(endValue = cList.getEndValue());
  if (endValue)
    assertTrue(endValue.equals(new Vector(0, 1)));

  // test iterator when there is a single data point
  cIter = cList.getIterator();
  assertTrue(cIter.hasNext());
  cIter.nextValue();
  assertEquals(0, cIter.getIndex());
  assertTrue(cIter.getValue().equals(new Vector(0, 1)));
  assertFalse(cIter.hasNext());
  assertThrows(function() { cIter.nextValue(); });

  // memorize second point
  j = cList.store(new Vector(0.1, 1.1));
  assertEquals(1, j);
  assertEquals(2, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(1, cList.getEndIndex());
  assertNotNull(endValue = cList.getEndValue());
  if (endValue)
    assertTrue(endValue.equals(new Vector(0.1, 1.1)));

  // test iterator when there are only two data points
  cIter = cList.getIterator();
  assertTrue(cIter.hasNext());
  cIter.nextValue();
  assertEquals(0, cIter.getIndex());
  assertTrue(cIter.getValue().equals(new Vector(0, 1)));
  assertTrue(cIter.hasNext());
  cIter.nextValue();
  assertEquals(1, cIter.getIndex());
  assertTrue(cIter.getValue().equals(new Vector(0.1, 1.1)));
  assertFalse(cIter.hasNext());
  assertThrows(function() { cIter.nextValue(); });

  // ask to iterate from a non-existent point
  assertThrows(function() { cList.getIterator(2); });

  // store enough points to fill the list
  for (i=2; i<10; i++) {
    j = cList.store(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1));
    assertEquals(i, j);
  }
  assertEquals(i, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(9, cList.getEndIndex());
  assertNotNull(endValue = cList.getEndValue());
  if (endValue)
    assertTrue(endValue.equals(new Vector(0.9, 10.9)));

  // iterate over the filled list and check values, indices 0 to 9
  cIter = /** @type {!HistoryIterator<!Vector>}*/(cList.getIterator());
  i = -1;
  while (cIter.hasNext()) {
    i++;
    cIter.nextValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1)));
  }
  assertEquals(9, i);
  assertThrows(function() { cIter.nextValue(); });
  assertEquals(10, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(9, cList.getEndIndex());

  // store another point, which will wrap around and be stored at first
  // position in the list.
  j = cList.store(new Vector(1, 11));
  assertEquals(10, j);
  assertEquals(10, cList.getSize());
  assertEquals(1, cList.getStartIndex());
  assertEquals(10, cList.getEndIndex());

  // iterate over the list and check values, indices 1 to 10
  cIter = /** @type {!HistoryIterator<!Vector>}*/(cList.getIterator());
  i = 0;
  while (cIter.hasNext()) {
    i++;
    cIter.nextValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1)));
  }
  assertEquals(10, i);
  assertThrows(function() { cIter.nextValue(); });

  // store points to fill to end of list
  for (i=11; i<20; i++) {
    j = cList.store(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1));
    assertEquals(i, j);
  }
  assertEquals(10, cList.getSize());
  assertEquals(10, cList.getStartIndex());
  assertEquals(19, cList.getEndIndex());

  // iterate over the list and check values, indices 10 to 19
  cIter = /** @type {!HistoryIterator<!Vector>}*/(cList.getIterator());
  i = 9;
  while (cIter.hasNext()) {
    i++;
    cIter.nextValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1)));
  }
  assertEquals(19, i);
  assertThrows(function() { cIter.nextValue(); });

  // store another point, which will wrap around and be stored at first
  // position in the list.
  j = cList.store(new Vector(2, 12));
  assertEquals(20, j);
  assertEquals(10, cList.getSize());
  assertEquals(11, cList.getStartIndex());
  assertEquals(20, cList.getEndIndex());

  // iterate over the list and check values, indices 11 to 20
  cIter = cList.getIterator();
  i = 10;
  while (cIter.hasNext()) {
    i++;
    cIter.nextValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, (i<5 ? 1:10)+i*0.1)));
  }
  assertEquals(20, i);
  assertThrows(function() { cIter.nextValue(); });

};
goog.exportProperty(window, 'testUtilCircularList1', testUtilCircularList1);


var testUtilCircularList2 = function() {
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  const CircularList = goog.module.get('myphysicslab.lab.util.CircularList');
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const HistoryList = goog.module.get('myphysicslab.lab.util.HistoryList');
  const HistoryIterator = goog.module.get('myphysicslab.lab.util.HistoryIterator');

  // Test that CircularList will throw the MAX_INT_ERROR when the index number
  // exceeds the maximum representable integer.
  /** @type {!HistoryList<!Vector>}*/
  var cList = new CircularList(1000);
  // Causes the index to start near the maximum integer.
  /** @type {!CircularList<!Vector>}*/(cList).causeMaxIntError();
  var i;
  var j=-1;
  var e = assertThrows(function() {
    for (i=0; i<3000; i++) {
      j = cList.store(new Vector(i*0.1, i*10));
    }
  });
  var err = /** @type {!Error} */(e);
  assertEquals(CircularList.MAX_INDEX_ERROR, err.message);
  assertTrue(j >= Util.MAX_INTEGER - 2);
  // show that we can still do reset after this error
  cList.reset();
  assertEquals(0, cList.getSize());
  assertEquals(0, cList.getStartIndex());
  assertEquals(-1, cList.getEndIndex());
  assertNull(cList.getEndValue());

  for (i=0; i<3000; i++) {
    j = cList.store(new Vector(i*0.1, i*10));
  }
  assertEquals(2999, j);
  assertEquals(2000, cList.getStartIndex());
  assertEquals(2999, cList.getEndIndex());

  // test starting in middle of the list
  /** @type {!HistoryIterator<!Vector>}*/
  var cIter = cList.getIterator(2500);
  i = 2499;
  while (cIter.hasNext()) {
    i++;
    cIter.nextValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, i*10)));
  }
  assertEquals(2999, i);
  assertThrows(function() { cIter.nextValue(); });
};
goog.exportProperty(window, 'testUtilCircularList2', testUtilCircularList2);


// test iterating backwards: start at end, go to previous points.
var testUtilCircularList3 = function() {
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  const CircularList = goog.module.get('myphysicslab.lab.util.CircularList');
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const HistoryList = goog.module.get('myphysicslab.lab.util.HistoryList');
  const HistoryIterator = goog.module.get('myphysicslab.lab.util.HistoryIterator');
  /** @type {!HistoryList<!Vector>}*/
  var cList = new CircularList(100);
  var i, j, vec;
  for (i=0; i<90; i++) {
    j = cList.store(new Vector(i*0.1, i*10));
    vec = cList.getValue(j);
    assertTrue(vec.equals(new Vector(i*0.1, i*10)));
  }
  assertEquals(89, j);
  assertEquals(0, cList.getStartIndex());
  assertEquals(89, cList.getEndIndex());
  /** @type {!HistoryIterator<!Vector>}*/
  var cIter = cList.getIterator(cList.getEndIndex());
  i = 90;
  while (cIter.hasPrevious()) {
    i--;
    assertTrue(i >= 0);
    cIter.previousValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, i*10)));
  }
  assertEquals(0, i);
  assertEquals(0, cIter.getIndex());
  assertFalse(cIter.hasPrevious());
  assertThrows(function() { cIter.previousValue(); });

  // fill the list beyond capacity, to wrap around and overwrite.
  for (i=90; i<110; i++) {
    j = cList.store(new Vector(i*0.1, i*10));
    vec = cList.getValue(j);
    assertTrue(vec.equals(new Vector(i*0.1, i*10)));
  }
  assertEquals(109, j);
  assertEquals(10, cList.getStartIndex());
  assertEquals(109, cList.getEndIndex());
  cIter = cList.getIterator(cList.getEndIndex());
  i = 110;
  while (cIter.hasPrevious()) {
    i--;
    assertTrue(i >= 10);
    cIter.previousValue();
    assertEquals(i, cIter.getIndex());
    assertTrue(cIter.getValue().equals(new Vector(i*0.1, i*10)));
  }
  assertEquals(10, i);
  assertEquals(10, cIter.getIndex());
  assertThrows(function() { cIter.previousValue(); });
};
goog.exportProperty(window, 'testUtilCircularList3', testUtilCircularList3);
