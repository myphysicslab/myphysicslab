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

import { AffineTransform } from "../../util/AffineTransform.js";
import { CoordMap } from "../CoordMap.js";
import { HorizAlign } from "../HorizAlign.js";
import { VerticalAlign } from "../VerticalAlign.js";
import { DisplayShape } from "../DisplayShape.js";
import { DoubleRect } from "../../util/DoubleRect.js";
import { PointMass } from "../../model/PointMass.js";
import { ScreenRect } from "../ScreenRect.js";
import { Vector } from "../../util/Vector.js";

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testDisplayShape);
};

const groupName = 'DisplayShapeTest.';

function testDisplayShape() {
  startTest(groupName+'testDisplayShape');
  var tol = 1E-14;
  var mockContext = new MockContext2D(tol) as unknown as CanvasRenderingContext2D;
  var mockContext2 = mockContext as unknown as MockContext2D;
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
  mockContext2.expectRect1 = map.simToScreen(new Vector(1, -2.8));
  mockContext2.expectRect2 = map.simToScreen(new Vector(3, -1.2));
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
  mockContext2.expectRect1 = map.simToScreen(new Vector(0, 0.2));
  mockContext2.expectRect2 = map.simToScreen(new Vector(2, 1.8));
  shape1.draw(mockContext, map);
  assertEquals('blue', mockContext.fillStyle);
};

/**  mock CanvasRenderingContext2D
*/
class MockContext2D {
  fillStyle: string|CanvasGradient = '';
  font: string = '';
  lineWidth: number = 0;
  strokeStyle: string = '';
  textAlign: string = '';
  textBaseline: string = '';
  tol: number;
  /**  expected rectangle point 1 */
  expectRect1: null|Vector = null;
  /**  expected rectangle point 2 */
  expectRect2: null|Vector = null;
  /**  expected screen coords point */
  startPoint: null|Vector = null;
  /**  last point drawn to */
  lastPoint: null|Vector = null;
  at: AffineTransform = AffineTransform.IDENTITY;

  constructor(tol: number) {
    this.tol = tol;
  };

  arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean): void {};
  beginPath(): void {};
  clearRect(_x: number, _y: number, _width: number, _height: number): void {};
  clip(): void {};
  closePath(): void {};
  drawImage(_image: HTMLImageElement|HTMLCanvasElement, _dx: number, _dy: number): void {};
  ellipse(_x: number, _y: number, _radiusX: number, _radiusY: number, _rotation: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean): void {};
  fill(): void {};
  fillText(_text: string, _x: number, _y: number): void {};
  lineTo(x: number, y: number): void {
    this.lastPoint = this.at.transform(x, y);
  };
  measureText(_text: string): TextMetrics {
    throw 'unimplemented';
  };
  moveTo(x: number, y: number): void {
    var pt1 = this.at.transform(x, y);
    if (this.startPoint != null) {
      // check that the rectangle being drawn matches expected rectangle
      assertRoughlyEquals(this.startPoint.getX(), pt1.getX(), this.tol);
      assertRoughlyEquals(this.startPoint.getY(), pt1.getY(), this.tol);
    }
  };
  rect(x: number, y: number, w: number, h: number): void {
    // check that the rectangle being drawn matches expected rectangle
    var pt1 = this.at.transform(x, y);
    var pt2 = this.at.transform(x+w, y+h);
    if (this.expectRect1 != null) {
      assertRoughlyEquals(this.expectRect1.getX(), pt1.getX(), this.tol);
      assertRoughlyEquals(this.expectRect1.getY(), pt1.getY(), this.tol);
    }
    if (this.expectRect2 != null) {
      assertRoughlyEquals(this.expectRect2.getX(), pt2.getX(), this.tol);
      assertRoughlyEquals(this.expectRect2.getY(), pt2.getY(), this.tol);
    }
  };
  restore(): void {
    this.at = AffineTransform.IDENTITY;
  };
  save(): void {};
  scale(_x: number, _y: number): void {};
  setLineDash(_segments: number[]): void {};
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.at = new AffineTransform(a, b, c, d, e, f);
  };
  stroke(): void {};
  transform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {};
  translate(_x: number, _y: number): void {};
} // end MockContext2D class
