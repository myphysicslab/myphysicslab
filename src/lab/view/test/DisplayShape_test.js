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

goog.provide('myphysicslab.lab.view.test.DisplayShape_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

var testDisplayShape = function() {
  var tol = 1E-14;
  const AffineTransform = goog.module.get('myphysicslab.lab.util.AffineTransform');
  var CoordMap = myphysicslab.lab.view.CoordMap;
  var DisplayShape = myphysicslab.lab.view.DisplayShape;
  const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
  var HorizAlign = myphysicslab.lab.view.HorizAlign;
  var PointMass = myphysicslab.lab.model.PointMass;
  var ScreenRect = myphysicslab.lab.view.ScreenRect;
  var SimObject = myphysicslab.lab.model.SimObject;
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

  /**  mock 2D context of a canvas element
  @constructor
  @extends {CanvasRenderingContext2D}
  */
  var MockContext = function() {
    /**  expected rectangle point 1
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.expectRect1 = null;
    /**  expected rectangle point 2
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.expectRect2 = null;
    /**  expected screen coords point
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.startPoint = null;
    /**  last point drawn to
    * @type {?myphysicslab.lab.util.Vector}
    */
    this.lastPoint = null;
    /**
    * @type {!myphysicslab.lab.util.AffineTransform}
    */
    this.at = AffineTransform.IDENTITY;
  };
  /** @override */
  MockContext.prototype.fillStyle = '';
  /** @override */
  MockContext.prototype.rect = function(x, y, w, h) {
    // check that the rectangle being drawn matches expected rectangle
    var pt1 = this.at.transform(x, y);
    var pt2 = this.at.transform(x+w, y+h);
    if (this.expectRect1 != null) {
      assertRoughlyEquals(this.expectRect1.getX(), pt1.getX(), tol);
      assertRoughlyEquals(this.expectRect1.getY(), pt1.getY(), tol);
    }
    if (this.expectRect2 != null) {
      assertRoughlyEquals(this.expectRect2.getX(), pt2.getX(), tol);
      assertRoughlyEquals(this.expectRect2.getY(), pt2.getY(), tol);
    }
  };
  /** @override */
  MockContext.prototype.strokeStyle = '';
  /** @override */
  MockContext.prototype.lineWidth = 0;
  /** @override */
  MockContext.prototype.moveTo = function(x, y) {
    var pt1 = this.at.transform(x, y);
    if (this.startPoint != null) {
      // check that the rectangle being drawn matches expected rectangle
      assertRoughlyEquals(this.startPoint.getX(), pt1.getX(), tol);
      assertRoughlyEquals(this.startPoint.getY(), pt1.getY(), tol);
    }
  };
  /** @override */
  MockContext.prototype.lineTo = function(x, y) {
    this.lastPoint = this.at.transform(x, y);
  };
  /** @override */
  MockContext.prototype.save = function() {};
  /** @override */
  MockContext.prototype.restore = function() {
    this.at = AffineTransform.IDENTITY;
  };
  /** @override */
  MockContext.prototype.stroke = function() {};
  /** @override */
  MockContext.prototype.beginPath = function() {};
  /** @override */
  MockContext.prototype.clearRect = function(x, y, w, h) {};
  /** @override */
  MockContext.prototype.setTransform = function(a, b, c, d, e, f) {
    this.at = new AffineTransform(a, b, c, d, e, f);
  };
  /** @override */
  MockContext.prototype.fill = function() {};

  var mockContext = new MockContext();

  // WIDE screen rect
  var screenRect = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500,
      /*height=*/300);
  var simRect = new DoubleRect(/*left=*/-10, /*bottom=*/-10, /*right=*/10, /*top=*/10);

  // WIDE =========  HorizAlign.LEFT, VerticalAlign.FULL ============
  var map = CoordMap.make(screenRect, simRect, HorizAlign.LEFT,
      VerticalAlign.FULL);
  var point1 = PointMass.makeRectangle(2, 1.6);
  point1.setPosition(new Vector(2, -2));
  var shape1 = new DisplayShape(point1);
  shape1.setFillStyle('orange');
  // check starting conditions
  assertEquals(point1, shape1.getSimObjects()[0]);
  assertTrue(shape1.contains(new Vector(2, -2)));
  assertFalse(shape1.contains(Vector.ORIGIN));
  assertTrue(shape1.getPosition().nearEqual(new Vector(2, -2), tol));
  assertEquals('orange', shape1.getFillStyle());
  assertTrue(shape1.isDragable());

  // set expected rectangle to be drawn
  mockContext.expectRect1 = map.simToScreen(new Vector(1, -2.8));
  mockContext.expectRect2 = map.simToScreen(new Vector(3, -1.2));
  shape1.draw(mockContext, map);
  assertEquals('orange', mockContext.fillStyle);

  // change some things, move to different position and color
  shape1.setDragable(false);
  assertFalse(shape1.isDragable());
  shape1.setFillStyle('blue');
  assertEquals('blue', shape1.getFillStyle());
  point1.setPosition(new Vector(1, 1));
  assertTrue(shape1.getPosition().nearEqual(new Vector(1, 1), tol));

  // set new expected rectangle to be drawn
  mockContext.expectRect1 = map.simToScreen(new Vector(0, 0.2));
  mockContext.expectRect2 = map.simToScreen(new Vector(2, 1.8));
  shape1.draw(mockContext, map);
  assertEquals('blue', mockContext.fillStyle);
};
goog.exportProperty(window, 'testDisplayShape', testDisplayShape);
