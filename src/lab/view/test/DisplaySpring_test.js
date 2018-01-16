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

goog.provide('myphysicslab.lab.view.test.DisplaySpring_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');
goog.require('myphysicslab.lab.model.SimObject');

var testDisplaySpring = function() {
  var tol = 1E-14;
  var CoordMap = myphysicslab.lab.view.CoordMap;
  var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
  var DoubleRect = myphysicslab.lab.util.DoubleRect;
  var HorizAlign = myphysicslab.lab.view.HorizAlign;
  var PointMass = myphysicslab.lab.model.PointMass;
  var Spring = myphysicslab.lab.model.Spring;
  var ScreenRect = myphysicslab.lab.view.ScreenRect;
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  var VerticalAlign = myphysicslab.lab.view.VerticalAlign;
  var SimObject = myphysicslab.lab.model.SimObject;

  /**  mock 2D context of a canvas element
  @constructor
  @extends {CanvasRenderingContext2D}
  */
  var MockContext = function() {
    /**  expected screen coords point
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.startPoint = null;
    /**  last point drawn to
    * @type {!myphysicslab.lab.util.Vector}
    */
    this.lastPoint = Vector.ORIGIN;
  };
  /** @inheritDoc */
  MockContext.prototype.strokeStyle = '';
  /** @inheritDoc */
  MockContext.prototype.lineWidth = 0;
  /** @inheritDoc */
  MockContext.prototype.moveTo = function(x, y) {
    if (!goog.isNull(this.startPoint)) {
      // check that the rectangle being drawn matches expected rectangle
      assertRoughlyEquals(this.startPoint.getX(), x, tol);
      assertRoughlyEquals(this.startPoint.getY(), y, tol);
    }
  };
  /** @inheritDoc */
  MockContext.prototype.lineTo = function(x, y) {
    this.lastPoint = new Vector(x, y);
  };
  /** @inheritDoc */
  MockContext.prototype.save = function() {};
  /** @inheritDoc */
  MockContext.prototype.restore = function() {};
  /** @inheritDoc */
  MockContext.prototype.stroke = function() {};
  /** @inheritDoc */
  MockContext.prototype.beginPath = function() {};

  var mockContext = new MockContext();

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
  dspring.draw(mockContext, map);
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
  dspring.draw(mockContext, map);
  // spring is compressed
  assertEquals('yellow', mockContext.strokeStyle);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(150, 150), 1E-13));

};
goog.exportProperty(window, 'testDisplaySpring', testDisplaySpring);
