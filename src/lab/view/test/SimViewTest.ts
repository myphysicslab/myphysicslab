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
import { DisplayShape } from "../DisplayShape.js";
import { DisplaySpring } from "../DisplaySpring.js"
import { DoubleRect } from "../../util/DoubleRect.js"
import { GenericEvent, GenericObserver, ParameterBoolean, ParameterNumber,
        ParameterString, Observer, SubjectEvent } from "../../util/Observe.js"
import { HorizAlign } from "../HorizAlign.js";
import { VerticalAlign } from "../VerticalAlign.js";
import { PointMass } from "../../model/PointMass.js";
import { ScreenRect } from "../ScreenRect.js"
import { SimObject } from "../../model/SimObject.js"
import { SimView } from "../SimView.js"
import { Spring } from "../../model/Spring.js";
import { Util } from "../../util/Util.js"
import { Vector } from "../../util/Vector.js";

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals,
    assertUndefined, assertElementsEquals, assertNull, myPrintln }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testSimView1);
  schedule(testSimView2);
};

const groupName = 'SimViewTest.';

function testSimView1() {
  startTest(groupName+'testSimView1');
  var tol = 1E-14;
  var mockContext = new MockContext2D(tol) as unknown as CanvasRenderingContext2D;
  var mockContext2 = mockContext as unknown as MockContext2D;
  var screenRect = new ScreenRect(0, 0, 500, 300);
  var simRect1 = new DoubleRect(-5, -5, 5, 5);
  var simView1 = new SimView('view1', simRect1);
  var displayList1 = simView1.getDisplayList();
  simView1.setHorizAlign(HorizAlign.LEFT);
  simView1.setVerticalAlign(VerticalAlign.FULL);
  var mockObsvr1 = new MockObserver();
  simView1.addObserver(mockObsvr1);
  assertTrue(simView1.getSimRect().equals(simRect1));
  simView1.setScreenRect(screenRect);
  assertTrue(simView1.getScreenRect().equals(screenRect));
  assertEquals(1, mockObsvr1.numScreenRectEvents);
  assertEquals('VIEW1', simView1.getName());
  var map = simView1.getCoordMap();
  var point1 = PointMass.makeSquare(1);
  var v1 = new Vector(2.5, 0);
  point1.setPosition(v1);
  var shape1 = new DisplayShape(point1);
  shape1.setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1);
  fixedPt.setMass(Infinity);
  fixedPt.setPosition(new Vector(-1,  0));

  assertTrue(v1 instanceof Vector);
  displayList1.add(shape1);
  assertTrue(displayList1.contains(shape1));
  assertEquals(1, displayList1.toArray().length);
  assertTrue(displayList1.toArray().includes(shape1));
  assertEquals(shape1, displayList1.find(point1));

  // set expected rectangle to be drawn
  mockContext2.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext2.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext2.startPoint = map.simToScreen(new Vector(-1, 0));
  simView1.paint(mockContext);
  assertEquals('orange', mockContext.fillStyle);
  // make a second 'slave' view
  var simRect2 = new DoubleRect(-2, -2, 2, 2);

  var simView2 = new SimView('simView2', simRect2);
  var mockObsvr2 = new MockObserver();
  simView2.addObserver(mockObsvr2);
  assertTrue(simView2.getSimRect().equals(simRect2));
  simView2.setScreenRect(screenRect);
  assertEquals(1, mockObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(screenRect));

  // this GenericObserver forces simView2 to have same simRect as simView1
  var matcher = new GenericObserver(simView1, evt => {
      if (evt.nameEquals(SimView.SIM_RECT_CHANGED)) {
        simView2.setSimRect(simView1.getSimRect());
      }
    }, 'match simRect');

  // change simRect1 and check that SimView2 matches
  assertEquals(0, mockObsvr1.numSimRectEvents);
  assertEquals(0, mockObsvr2.numSimRectEvents);
  simRect1 = new DoubleRect(-15, -15, 15, 15);
  simView1.setSimRect(simRect1);
  assertEquals(1, mockObsvr1.numSimRectEvents);
  assertEquals(1, mockObsvr2.numSimRectEvents);
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertEquals(simView1.getSimRect().getLeft(), simView2.getSimRect().getLeft());
  assertEquals(simView1.getSimRect().getRight(), simView2.getSimRect().getRight());
  assertEquals(simView1.getSimRect().getBottom(), simView2.getSimRect().getBottom());
  assertEquals(simView1.getSimRect().getTop(), simView2.getSimRect().getTop());

  // disconnect simView2 from simView1
  matcher.disconnect();
  assertEquals(1, mockObsvr2.numSimRectEvents);  // no simRect event
  simRect2 = simView2.getSimRect();
  assertTrue(simRect2.equals(simView1.getSimRect())); // same simRect for 1 and 2

  // change SimView1 and check that SimView2 doesn't change
  simRect1 = new DoubleRect(-30, -30, 30, 30);
  simView1.setSimRect(simRect1);
  assertEquals(2, mockObsvr1.numSimRectEvents);
  assertEquals(1, mockObsvr2.numSimRectEvents); // no simRect event
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertTrue(simView2.getSimRect().equals(simRect2)); // no change

  // alignment and aspect ratio
  assertEquals(HorizAlign.LEFT, simView1.getHorizAlign());
  simView1.setHorizAlign(HorizAlign.RIGHT);
  assertEquals(HorizAlign.RIGHT, simView1.getHorizAlign());
  assertEquals(VerticalAlign.FULL, simView1.getVerticalAlign());
  simView1.setVerticalAlign(VerticalAlign.BOTTOM);
  assertEquals(VerticalAlign.BOTTOM, simView1.getVerticalAlign());
  assertEquals(1.0, simView1.getAspectRatio());
  simView1.setAspectRatio(1.5);
  assertRoughlyEquals(1.5, simView1.getAspectRatio(), 1E-15);
  //check that setting bad alignment value throws an exception
  // (The type casting is needed to fool the compiler into passing bad values).
  assertThrows(() => simView1.setHorizAlign('foo' as HorizAlign));
  assertThrows(() => simView1.setVerticalAlign('bar' as VerticalAlign));

  // remove DisplayObjects from simView1's list of DisplayObjects
  displayList1.remove(shape1);
  assertFalse(displayList1.contains(shape1));
  assertEquals(0, displayList1.toArray().length);
  assertFalse(displayList1.toArray().includes(shape1));

  assertThrows(() => new SimView('badView', DoubleRect.EMPTY_RECT));
};

// this is similar to testSimView1(), but includes the DisplaySpring also
function testSimView2() {
  startTest(groupName+'testSimView2');
  var tol = 1E-14;
  var mockContext = new MockContext2D(tol) as unknown as CanvasRenderingContext2D;
  var mockContext2 = mockContext as unknown as MockContext2D;
  var screenRect = new ScreenRect(0, 0, 500, 300);
  var simRect1 = new DoubleRect(-5, -5, 5, 5);
  var simView1 = new SimView('view1', simRect1);
  var displayList1 = simView1.getDisplayList();
  simView1.setHorizAlign(HorizAlign.LEFT);
  simView1.setVerticalAlign(VerticalAlign.FULL);
  var mockObsvr1 = new MockObserver();
  simView1.addObserver(mockObsvr1);
  assertTrue(simView1.getSimRect().equals(simRect1));
  simView1.setScreenRect(screenRect);
  assertTrue(simView1.getScreenRect().equals(screenRect));
  assertEquals(1, mockObsvr1.numScreenRectEvents);
  assertEquals('VIEW1', simView1.getName());
  var map = simView1.getCoordMap();
  var point1 = PointMass.makeSquare(1);
  var v1 = new Vector(2.5, 0);
  point1.setPosition(v1);
  var shape1 = new DisplayShape(point1)
  shape1.setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1)
  fixedPt.setMass(Infinity);
  fixedPt.setPosition(new Vector(-1,  0));
  var spring1 = new Spring('spring1',
      fixedPt, Vector.ORIGIN,
      point1, Vector.ORIGIN,
      2, 12);  // restlength & stiffness
  var dspring1 = new DisplaySpring(spring1).setWidth(1.0);
  dspring1.setColorCompressed('red');
  dspring1.setColorExpanded('green')

  assertTrue(v1 instanceof Vector);
  displayList1.add(shape1);
  displayList1.add(dspring1);
  assertTrue(displayList1.contains(shape1));
  assertTrue(displayList1.contains(dspring1));
  assertEquals(2, displayList1.toArray().length);
  assertTrue(displayList1.toArray().includes(shape1));
  assertTrue(displayList1.toArray().includes(dspring1));
  assertEquals(shape1, displayList1.find(point1));
  assertEquals(dspring1, displayList1.find(spring1));

  // set expected rectangle to be drawn
  mockContext2.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext2.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext2.startPoint = map.simToScreen(new Vector(-1, 0));
  simView1.paint(mockContext);
  assertEquals('orange', mockContext.fillStyle);
  if (mockContext2.lastPoint === null) { throw 'lastPoint null'; }
  assertTrue(mockContext2.lastPoint.nearEqual(map.simToScreen(v1)));
  // spring is expanded
  assertEquals('green', mockContext.strokeStyle);

  // make a second 'slave' view
  var simRect2 = new DoubleRect(-2, -2, 2, 2);

  var simView2 = new SimView('simView2', simRect2);
  var mockObsvr2 = new MockObserver();
  simView2.addObserver(mockObsvr2);
  assertTrue(simView2.getSimRect().equals(simRect2));
  simView2.setScreenRect(screenRect);
  assertEquals(1, mockObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(screenRect));

  // this GenericObserver forces simView2 to have same simRect as simView1
  var matcher = new GenericObserver(simView1, evt => {
      if (evt.nameEquals(SimView.SIM_RECT_CHANGED)) {
        simView2.setSimRect(simView1.getSimRect());
      }
    }, 'match simRect');

  // change simRect1 and check that SimView2 matches
  assertEquals(0, mockObsvr1.numSimRectEvents);
  assertEquals(0, mockObsvr2.numSimRectEvents);
  simRect1 = new DoubleRect(-15, -15, 15, 15);
  simView1.setSimRect(simRect1);
  assertEquals(1, mockObsvr1.numSimRectEvents);
  assertEquals(1, mockObsvr2.numSimRectEvents);
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertEquals(simView1.getSimRect().getLeft(), simView2.getSimRect().getLeft());
  assertEquals(simView1.getSimRect().getRight(), simView2.getSimRect().getRight());
  assertEquals(simView1.getSimRect().getBottom(), simView2.getSimRect().getBottom());
  assertEquals(simView1.getSimRect().getTop(), simView2.getSimRect().getTop());

  // disconnect simView2 from simView1
  matcher.disconnect();
  assertEquals(1, mockObsvr2.numSimRectEvents);  // no simRect event
  simRect2 = simView2.getSimRect();
  assertTrue(simRect2.equals(simView1.getSimRect())); // same simRect for 1 and 2

  // change SimView1 and check that SimView2 doesn't change
  simRect1 = new DoubleRect(-30, -30, 30, 30);
  simView1.setSimRect(simRect1);
  assertEquals(2, mockObsvr1.numSimRectEvents);
  assertEquals(1, mockObsvr2.numSimRectEvents); // no simRect event
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertTrue(simView2.getSimRect().equals(simRect2)); // no change

  // alignment and aspect ratio
  assertEquals(HorizAlign.LEFT, simView1.getHorizAlign());
  simView1.setHorizAlign(HorizAlign.RIGHT);
  assertEquals(HorizAlign.RIGHT, simView1.getHorizAlign());
  assertEquals(VerticalAlign.FULL, simView1.getVerticalAlign());
  simView1.setVerticalAlign(VerticalAlign.BOTTOM);
  assertEquals(VerticalAlign.BOTTOM, simView1.getVerticalAlign());
  assertEquals(1.0, simView1.getAspectRatio());
  simView1.setAspectRatio(1.5);
  assertRoughlyEquals(1.5, simView1.getAspectRatio(), 1E-15);
  //check that setting bad alignment value throws an exception
  // (The type casting is needed to fool the compiler into passing bad values).
  assertThrows(() => simView1.setHorizAlign('foo' as HorizAlign));
  assertThrows(() => simView1.setVerticalAlign('bar' as VerticalAlign));

  // remove DisplayObjects from simView1's list of DisplayObjects
  displayList1.remove(shape1);
  assertFalse(displayList1.contains(shape1));
  assertEquals(1, displayList1.toArray().length);
  assertFalse(displayList1.toArray().includes(shape1));

  displayList1.removeAll();
  assertFalse(displayList1.contains(dspring1));
  assertEquals(0, displayList1.toArray().length);
  assertFalse(displayList1.toArray().includes(dspring1));

  assertThrows(() => new SimView('badView', DoubleRect.EMPTY_RECT));
};


/**  Observer that counts number of times that parameters are changed or
*    events fire.
*/
class MockObserver implements Observer {
     numEvents: number = 0;
     numScreenRectEvents: number = 0;
     numSimRectEvents: number = 0;
     numBooleans: number = 0;
     numDoubles: number = 0;
     numStrings: number = 0;

  constructor() {};

  observe(event: SubjectEvent) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      if (event.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.numScreenRectEvents++;
      } else if (event.nameEquals(SimView.SIM_RECT_CHANGED)) {
        this.numSimRectEvents++;
      }
    } else if (event instanceof ParameterBoolean) {
      this.numBooleans++;
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
    } else if (event instanceof ParameterString) {
      this.numStrings++;
    }
  };
  toStringShort() {
    return 'MockObserver';
  };
}; // end MockObserver class

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
}; // end MockContext2D class
