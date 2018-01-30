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

goog.module('myphysicslab.lab.view.test.DisplayLine_test');

goog.require('goog.testing.jsunit');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

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
    if (!goog.isNull(this.startPoint)) {
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

/** @suppress {invalidCasts} */
var testDisplayLine = function() {
  var tol = 1E-14;
  var mockContext = new MockContext(tol);
  // WIDE screen rect
  var screenRect = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500,
      /*height=*/300);
  var simRect = new DoubleRect(/*left=*/-10, /*bottom=*/-10, /*right=*/10, /*top=*/10);

  // WIDE =========  HorizAlign.LEFT, VerticalAlign.FULL ============
  var map = CoordMap.make(screenRect, simRect, HorizAlign.LEFT,
      VerticalAlign.FULL);

  var p2 = new Vector(-5, 5);
  var p3 = new Vector(5, -5);
  var line1 = new ConcreteLine('line1');
  line1.setStartPoint(p2);
  line1.setEndPoint(p3);
  var dline = new DisplayLine(line1);
  dline.setThickness(2.0);
  dline.setColor('fuschia');

  // check starting conditions
  assertEquals(line1, dline.getSimObjects()[0]);
  assertFalse(dline.contains(new Vector(2, -2)));
  assertTrue(dline.getPosition().nearEqual(Vector.ORIGIN, tol));

  // set expected start point to be drawn
  mockContext.startPoint = new Vector(75, 75);
  dline.draw(/** @type {!CanvasRenderingContext2D} */(mockContext), map);
  assertEquals('fuschia', mockContext.strokeStyle);
  assertEquals(2, mockContext.lineWidth);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(225, 225), 1E-13));

  // move the line
  line1.setEndPoint(Vector.ORIGIN);
  dline.draw(/** @type {!CanvasRenderingContext2D} */(mockContext), map);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(150, 150), 1E-13));
};
goog.exportProperty(window, 'testDisplayLine', testDisplayLine);
