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

goog.module('myphysicslab.lab.view.test.DisplaySpringTest');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

/**  mock CanvasRenderingContext2D
*/
class MockContext {
  /**
  * @param {number} tol
  */
  constructor(tol) {
    /**
    * @type {number}
    */
    this.tol = tol;
    /**  expected screen coords point
    * @type {?Vector}
    */
    this.startPoint = null;
    /**  last point drawn to
    * @type {!Vector}
    */
    this.lastPoint = Vector.ORIGIN;
    /**
    * @type {string}
    */
    this.strokeStyle = '';
    /**
    * @type {number}
    */
    this.lineWidth = 0;
  };
  /**
   * @param {number} x
   * @param {number} y
   * @return {undefined}
   */
  moveTo(x, y) {
    if (this.startPoint != null) {
      // check that the point being drawn matches expected point
      assertRoughlyEquals(this.startPoint.getX(), x, this.tol);
      assertRoughlyEquals(this.startPoint.getY(), y, this.tol);
    }
  };
  /**
   * @param {number} x
   * @param {number} y
   * @return {undefined}
   */
  lineTo(x, y) {
    this.lastPoint = new Vector(x, y);
  };
  save() {};
  restore() {};
  stroke() {};
  beginPath() {};
} // end class

class DisplaySpringTest {

static test() {
  schedule(DisplaySpringTest.testDisplaySpring);
};

/** @suppress {invalidCasts} */
static testDisplaySpring() {
  startTest(DisplaySpringTest.groupName+'testDisplaySpring');
  var tol = 1E-14;
  var mockContext = new MockContext(tol);

  // WIDE screen rect
  var screenRect = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500,
      /*height=*/300);
  var simRect = new DoubleRect(/*left=*/-10, /*bottom=*/-10, /*right=*/10, /*top=*/10);

  // WIDE =========  HorizAlign.LEFT, VerticalAlign.FULL ============
  var map = CoordMap.make(screenRect, simRect, HorizAlign.LEFT,
      VerticalAlign.FULL);

  var p2 = PointMass.makeCircle(1, 'point2').setMass(2);
  p2.setPosition(new Vector(-5,  5));
  var p3 = PointMass.makeCircle(1, 'point3').setMass(0.5);
  p3.setPosition(new Vector(5,  -5));
  var spring1 = new Spring('spring1',
      p2, Vector.ORIGIN,
      p3, Vector.ORIGIN,
      /*restLength=*/8, /*stiffness=*/12);
  var dspring = new DisplaySpring(spring1).setWidth(1.0)
      .setColorCompressed('fuschia').setColorExpanded('gray');

  // check starting conditions
  assertEquals(spring1, dspring.getSimObjects()[0]);
  assertFalse(dspring.contains(new Vector(2, -2)));
  assertTrue(dspring.getPosition().nearEqual(Vector.ORIGIN, tol));
  assertEquals('fuschia', dspring.getColorCompressed());
  assertEquals('gray', dspring.getColorExpanded());

  // set expected start point to be drawn
  mockContext.startPoint = new Vector(75, 75);
  dspring.draw(/** @type {!CanvasRenderingContext2D} */(mockContext), map);
  // spring is expanded
  assertEquals('gray', mockContext.strokeStyle);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(225, 225), 1E-13));

  // change colors
  dspring.setColorCompressed('yellow');
  dspring.setColorExpanded('blue');
  assertEquals('yellow', dspring.getColorCompressed());
  assertEquals('blue', dspring.getColorExpanded());

  // move the spring so it is compressed
  p3.setPosition(new Vector(0,  0));
  dspring.draw(/** @type {!CanvasRenderingContext2D} */(mockContext), map);
  // spring is compressed
  assertEquals('yellow', mockContext.strokeStyle);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(150, 150), 1E-13));
};

} // end class

/**
* @type {string}
* @const
*/
DisplaySpringTest.groupName = 'DisplaySpringTest.';

exports = DisplaySpringTest;
