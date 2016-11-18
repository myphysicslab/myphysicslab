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

goog.provide('myphysicslab.lab.model.test.SimList_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.ShapeType');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');

var testSimList = function() {
  var Vector = myphysicslab.lab.util.Vector;
  var PointMass = myphysicslab.lab.model.PointMass;
  var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
  var Spring = myphysicslab.lab.model.Spring;
  var SimList = myphysicslab.lab.model.SimList;
  var SimObject = myphysicslab.lab.model.SimObject;
  var Observer = myphysicslab.lab.util.Observer;
  var ShapeType = myphysicslab.lab.model.ShapeType;

  /** observer that tracks the number of each type of SimObject in list
  @constructor
  @implements {myphysicslab.lab.util.Observer}
  */
  var MockObserver1 = function() {
    /**
    * @type {number}
    */
    this.numPoints = 0;
    /**
    * @type {number}
    */
    this.numRectangles = 0;
    /**
    * @type {number}
    */
    this.numLines = 0;
    /**
    * @type {number}
    */
    this.numSprings = 0;
  };

  /** @inheritDoc */
  MockObserver1.prototype.observe =  function(event) {
    var obj = /** @type {!myphysicslab.lab.model.SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (obj instanceof Spring) {
        this.numSprings++;
      } else if (obj instanceof PointMass) {
        var pm = /** @type {!PointMass} */(obj);
        if (pm.getShape() == ShapeType.OVAL) {
          this.numPoints++;
        } else if (pm.getShape() == ShapeType.RECTANGLE) {
          this.numRectangles++;
        }
      } else if (obj instanceof ConcreteLine) {
        this.numLines++;
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      if (obj instanceof Spring) {
        this.numSprings--;
      } else if (obj instanceof PointMass) {
        var pm = /** @type {!PointMass} */(obj);
        if (pm.getShape() == ShapeType.OVAL) {
          this.numPoints--;
        } else if (pm.getShape() == ShapeType.RECTANGLE) {
          this.numRectangles--;
        }
      } else if (obj instanceof ConcreteLine) {
        this.numLines--;
      }
    }
  };
  MockObserver1.prototype.toStringShort = function() {
    return 'MockObserver1';
  };
  var myMockObserver = new MockObserver1();

  // create a bunch of SimObject's
  var p1 = PointMass.makeCircle(1, 'point1');
  p1.setPosition(new Vector(2,  -2));
  var p2 = PointMass.makeCircle(1, 'point2');
  p2.setPosition(new Vector(2.01,  -2.02));
  var l1 = new ConcreteLine('line1');
  l1.setStartPoint(new Vector(2, 0));
  l1.setEndPoint(new Vector(0, 2));
  l1.setExpireTime(/*time=*/3);
  var l2 = new ConcreteLine('line2');
  l2.setStartPoint(new Vector(2.01, 0.01));
  l2.setEndPoint(new Vector(0.02, 2.02));
  l2.setExpireTime(/*time=*/3);
  // l3 is similar to l1, and so will not be added to SimList
  var l3 = new ConcreteLine('line3');
  l3.setStartPoint(new Vector(2.01, 0.01));
  l3.setEndPoint(new Vector(0.02, 2.02));
  l3.setExpireTime(/*time=*/3);
  var l4 = new ConcreteLine('line4');
  l4.setStartPoint(new Vector(20, 20));
  l4.setEndPoint(new Vector(40, 40));
  l4.setExpireTime(/*time=*/3);
  var s1 = new Spring('spring1',
      p1, Vector.ORIGIN,
      p2, Vector.ORIGIN,
      /*restLength=*/2, /*stiffness=*/12);
  var r1 = PointMass.makeRectangle(3, 2, 'rect1').setMass(2);
  // put objects into SimList
  var simList = new myphysicslab.lab.model.SimList();
  assertEquals(0.1, simList.getTolerance());
  assertEquals(0, simList.length());
  simList.addObserver(myMockObserver);
  simList.add(p1);
  assertEquals(1, simList.length());
  simList.add(p2);
  assertEquals(2, simList.length());
  simList.add(l3, s1);  // add multiple arguments at once
  assertEquals(4, simList.length());
  simList.add(r1);
  assertEquals(5, simList.length());

  // l3 is similar to l1, and so l3 will be removed from SimList
  assertTrue(l1.similar(l3, 0.1));
  assertEquals(l3, simList.getSimilar(l1));
  simList.add(l1);
  assertEquals(5, simList.length());
  assertFalse(simList.contains(l3));

  // get objects by index
  assertEquals(p1, simList.get(0));
  assertEquals(p2, simList.get(1));
  assertEquals(s1, simList.get(2));
  assertEquals(r1, simList.get(3));
  assertEquals(l1, simList.get(4));
  assertEquals(0, simList.indexOf(p1));
  assertEquals(1, simList.indexOf(p2));
  assertEquals(2, simList.indexOf(s1));
  assertEquals(3, simList.indexOf(r1));
  assertEquals(4, simList.indexOf(l1));
  assertTrue(simList.contains(p1));
  assertTrue(simList.contains(p2));
  assertTrue(simList.contains(l1));
  assertTrue(simList.contains(s1));
  assertTrue(simList.contains(r1));
  // get objects by name
  assertEquals(p1, simList.get('point1'));
  assertEquals(p1, simList.getPointMass('point1'));
  assertEquals(p2, simList.get('point2'));
  assertEquals(p2, simList.getPointMass('point2'));
  assertEquals(l1, simList.get('line1'));
  assertEquals(l1, simList.getConcreteLine('line1'));
  assertEquals(s1, simList.get('spring1'));
  assertEquals(s1, simList.getSpring('spring1'));
  assertEquals(r1, simList.get('rect1'));
  assertEquals(r1, simList.getPointMass('rect1'));
  // similarity depends on tolerance
  assertEquals(l1, simList.getSimilar(l2, /*tolerance=*/0.05));
  assertNull(simList.getSimilar(l2, /*tolerance=*/0.01));
  // show that observer counted correctly
  assertEquals(2, myMockObserver.numPoints);
  assertEquals(1, myMockObserver.numLines);
  assertEquals(1, myMockObserver.numSprings);
  assertEquals(1, myMockObserver.numRectangles);

  // remove the observer so it can't observe changes
  simList.removeObserver(myMockObserver);
  simList.add(l4);
  assertEquals(1, myMockObserver.numLines);
  simList.remove(l4);
  assertEquals(1, myMockObserver.numLines);
  // add back the observer, and show that removals are observed
  simList.addObserver(myMockObserver);
  simList.add(l4);
  assertTrue(simList.contains(l4));
  assertEquals(2, myMockObserver.numLines);

  simList.removeTemporary(/*time=*/10); // removes l1, l4
  assertFalse(simList.contains(l4));
  assertThrows(function() { simList.get('line4') });
  assertEquals(0, myMockObserver.numLines);

  simList.clear();
  assertEquals(0, simList.toArray().length);
  assertEquals(0, myMockObserver.numPoints);
  assertEquals(0, myMockObserver.numLines);
  assertEquals(0, myMockObserver.numSprings);
  assertEquals(0, myMockObserver.numRectangles);
};
goog.exportProperty(window, 'testSimList', testSimList);

/**
* @suppress {checkTypes}
*/
var testSimListThrows = function() {
  var simList = new myphysicslab.lab.model.SimList();
  var e = assertThrows(function() {simList.add(null);}  );
  assertTrue(e instanceof Error);
  assertEquals('cannot add invalid SimObject', e.message);
  var p1 = new myphysicslab.lab.model.PointMass('point1');
  simList.add(p1);
  assertEquals(p1, simList.get('point1'));
  assertEquals(p1, simList.getPointMass('point1'));
  assertThrows(function() {simList.getSpring('point1');} );
  assertThrows(function() {simList.getConcreteLine('point1');} );
  assertThrows(function() {simList.get(p1);} );
  assertThrows(function() {simList.get([0]);} );
  assertThrows(function() {simList.get(true);} );
};
goog.exportProperty(window, 'testSimListThrows', testSimListThrows);
