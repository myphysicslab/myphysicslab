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

goog.provide('myphysicslab.lab.view.test.DisplayLine_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

var testDisplayLine = function() {
  var tol = 1E-14;
  var CoordMap = myphysicslab.lab.view.CoordMap;
  var DisplayLine = myphysicslab.lab.view.DisplayLine;
  var DoubleRect = myphysicslab.lab.util.DoubleRect;
  var HorizAlign = myphysicslab.lab.view.HorizAlign;
  var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
  var ScreenRect = myphysicslab.lab.view.ScreenRect;
  var Vector = myphysicslab.lab.util.Vector;
  var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

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
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.lastPoint = null;
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

  var p2 = new Vector(-5, 5);
  var p3 = new Vector(5, -5);
  var line1 = new ConcreteLine('line1');
  line1.setStartPoint(p2);
  line1.setEndPoint(p3);
  DisplayLine.thickness = 2.0;
  DisplayLine.color = 'fuschia';
  var dline = new DisplayLine(line1);

  // check starting conditions
  assertEquals(line1, dline.getSimObjects()[0]);
  assertFalse(dline.contains(new Vector(2, -2)));
  assertTrue(dline.getPosition().nearEqual(Vector.ORIGIN, tol));

  // set expected start point to be drawn
  mockContext.startPoint = new Vector(75, 75);
  dline.draw(mockContext, map);
  assertEquals('fuschia', mockContext.strokeStyle);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(225, 225), 1E-13));

  // move the line
  line1.setEndPoint(Vector.ORIGIN);
  dline.draw(mockContext, map);
  // check last point drawn to
  assertTrue(mockContext.lastPoint.nearEqual(new Vector(150, 150), 1E-13));

};
goog.exportProperty(window, 'testDisplayLine', testDisplayLine);
