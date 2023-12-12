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
import { LabCanvas } from "../LabCanvas.js"
import { PointMass } from "../../model/PointMass.js";
import { ScreenRect } from "../ScreenRect.js"
import { SimObject } from "../../model/SimObject.js"
import { SimView } from "../SimView.js"
import { Spring } from "../../model/Spring.js";
import { Util } from "../../util/Util.js"
import { Vector } from "../../util/Vector.js";

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals, assertNotNull, myPrintln }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testLabCanvas1);
  schedule(testLabCanvas2);
};

const groupName = 'LabCanvasTest.';

function testLabCanvas1() {
  startTest(groupName+'testLabCanvas1');
  var tol = 1E-14;
  var simRect1 = new DoubleRect(-5, -5, 5, 5);
  var simView1 = new SimView('simView1', simRect1);
  var displayList1 = simView1.getDisplayList();
  simView1.setHorizAlign(HorizAlign.LEFT);
  simView1.setVerticalAlign(VerticalAlign.FULL);
  var mockViewObsvr1 = new MockViewObserver();
  simView1.addObserver(mockViewObsvr1);
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertEquals(0, mockViewObsvr1.numScreenRectEvents);

  var point1 = PointMass.makeSquare(1);
  var v1 = new Vector(2.5, 0);
  point1.setPosition(v1);
  var shape1 = new DisplayShape(point1);
  shape1.setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1);
  fixedPt.setMass(Infinity);
  fixedPt.setPosition(new Vector(-1,  0));
  displayList1.add(shape1);

  const mockCanvas: HTMLCanvasElement
      = new MockCanvas(tol) as unknown as HTMLCanvasElement;
  var labCanvas = new LabCanvas(mockCanvas, 'lc1');
  var mockLCObsvr = new MockLCObserver();
  labCanvas.addObserver(mockLCObsvr);
  assertEquals('LC1', labCanvas.getName());
  assertEquals(mockCanvas, labCanvas.getCanvas());
  labCanvas.addView(simView1);
  assertEquals(1, mockLCObsvr.numListModifiedEvents);
  assertEquals(1, mockLCObsvr.numFocusChangedEvents);
  // screen rect not set because the LabCanvas has zero size now.
  assertEquals(0, mockViewObsvr1.numScreenRectEvents);
  assertEquals(simView1, labCanvas.getFocusView());
  assertEquals(simView1, labCanvas.getViews()[0]);
  assertEquals(1, labCanvas.getViews().length);
  assertEquals(0, labCanvas.getViews().indexOf(simView1));
  labCanvas.setSize(500, 300);
  assertEquals(500, labCanvas.getWidth());
  assertEquals(300, labCanvas.getHeight());
  assertEquals(1, mockViewObsvr1.numScreenRectEvents);
  assertEquals(500, simView1.getScreenRect().getWidth());
  assertEquals(300, simView1.getScreenRect().getHeight());

  // set expected rectangle to be drawn
  var map = simView1.getCoordMap();
  var mockContext = labCanvas.getCanvas().getContext('2d');
  if (mockContext === null) {
    throw '';
  }
  var mockContext2 = mockContext as unknown as MockContext2D;
  mockContext2.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext2.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext2.startPoint = map.simToScreen(new Vector(-1, 0));
  labCanvas.paint();
  assertEquals('orange', mockContext.fillStyle);
  // add a second view
  var simRect2 = new DoubleRect(-2, -2, 2, 2);

  var simView2 = new SimView('simView2', simRect2);
  var mockViewObsvr2 = new MockViewObserver();
  simView2.addObserver(mockViewObsvr2);
  assertEquals(-1, labCanvas.getViews().indexOf(simView2));
  labCanvas.addView(simView2);
  assertEquals(2, mockLCObsvr.numListModifiedEvents);
  assertEquals(1, mockViewObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(new ScreenRect(0, 0, 500, 300)));
  assertEquals(simView1, labCanvas.getFocusView());
  assertEquals(simView2, labCanvas.getViews()[1]);
  assertEquals(2, labCanvas.getViews().length);
  assertEquals(1, labCanvas.getViews().indexOf(simView2));

  // cannot set focus to an unknown view
  assertThrows(() => labCanvas.setFocusView(new SimView('unknown', simRect2)) );

  // change focus to simView2
  labCanvas.setFocusView(simView2);
  assertEquals(2, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView2, labCanvas.getFocusView());

  // change focus back to simView1
  labCanvas.setFocusView(simView1);
  assertEquals(3, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView1, labCanvas.getFocusView());

  // remove the focus view
  labCanvas.removeView(simView1);
  assertEquals(1, mockLCObsvr.numViewRemovedEvents);
  assertEquals(3, mockLCObsvr.numListModifiedEvents);
  assertEquals(4, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView2, labCanvas.getFocusView());
  assertEquals(simView2, labCanvas.getViews()[0]);
  assertEquals(1, labCanvas.getViews().length);
  assertEquals(0, labCanvas.getViews().indexOf(simView2));

  assertThrows(() => labCanvas.setSize(0, 0));
  assertThrows(() => labCanvas.setSize(100, 0));
  assertThrows(() => labCanvas.setSize(0, 100));
  assertThrows(() => labCanvas.setSize(100, -1));
  assertThrows(() => labCanvas.setSize(-1, 100));
};

// similar to testLabCanvas1(), but with Spring
function testLabCanvas2() {
  startTest(groupName+'testLabCanvas2');
  var tol = 1E-14;
  var simRect1 = new DoubleRect(-5, -5, 5, 5);
  var simView1 = new SimView('simView1', simRect1);
  var displayList1 = simView1.getDisplayList();
  simView1.setHorizAlign(HorizAlign.LEFT);
  simView1.setVerticalAlign(VerticalAlign.FULL);
  var mockViewObsvr1 = new MockViewObserver();
  simView1.addObserver(mockViewObsvr1);
  assertTrue(simView1.getSimRect().equals(simRect1));
  assertEquals(0, mockViewObsvr1.numScreenRectEvents);

  var point1 = PointMass.makeSquare(1);
  var v1 = new Vector(2.5, 0);
  point1.setPosition(v1);
  var shape1 = new DisplayShape(point1);
  shape1.setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1);
  fixedPt.setMass(Infinity);
  fixedPt.setPosition(new Vector(-1,  0));
  var spring1 = new Spring('spring1',
      fixedPt, Vector.ORIGIN,
      point1, Vector.ORIGIN,
      2, 12);
  var dspring1 = new DisplaySpring(spring1);
  dspring1.setWidth(1.0);
  dspring1.setColorCompressed('red');
  dspring1.setColorExpanded('green');
  dspring1.setDrawMode(DisplaySpring.STRAIGHT);
  displayList1.add(shape1);
  displayList1.add(dspring1);

  const mockCanvas: HTMLCanvasElement
      = new MockCanvas(tol) as unknown as HTMLCanvasElement;
  var labCanvas = new LabCanvas(mockCanvas, 'lc1');
  var mockLCObsvr = new MockLCObserver();
  labCanvas.addObserver(mockLCObsvr);
  assertEquals('LC1', labCanvas.getName());
  assertEquals(mockCanvas, labCanvas.getCanvas());
  labCanvas.addView(simView1);
  assertEquals(1, mockLCObsvr.numListModifiedEvents);
  assertEquals(1, mockLCObsvr.numFocusChangedEvents);
  // screen rect not set because the LabCanvas has zero size now.
  assertEquals(0, mockViewObsvr1.numScreenRectEvents);
  assertEquals(simView1, labCanvas.getFocusView());
  assertEquals(simView1, labCanvas.getViews()[0]);
  assertEquals(1, labCanvas.getViews().length);
  assertEquals(0, labCanvas.getViews().indexOf(simView1));
  labCanvas.setSize(500, 300);
  assertEquals(500, labCanvas.getWidth());
  assertEquals(300, labCanvas.getHeight());
  assertEquals(1, mockViewObsvr1.numScreenRectEvents);
  assertEquals(500, simView1.getScreenRect().getWidth());
  assertEquals(300, simView1.getScreenRect().getHeight());

  // set expected rectangle to be drawn
  var map = simView1.getCoordMap();
  assertTrue(spring1.getStartPoint().nearEqual(new Vector(-1, 0), 1e-8));
  assertTrue(map.simToScreen(spring1.getStartPoint()).nearEqual(new Vector(120, 150),
      1e-8));
  var mockContext = labCanvas.getCanvas().getContext('2d') as unknown as CanvasRenderingContext2D;
  var mockContext2 = mockContext as unknown as MockContext2D;
  assertNotNull(mockContext);
  mockContext2.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext2.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext2.startPoint = map.simToScreen(new Vector(-1, 0));
  labCanvas.paint();
  assertEquals('orange', mockContext.fillStyle);
  if (mockContext2.lastPoint === null) { throw 'lastPoint null' }
  assertTrue(mockContext2.lastPoint.nearEqual(map.simToScreen(v1)));
  // spring is expanded
  assertEquals('green', mockContext.strokeStyle);

  // add a second view
  var simRect2 = new DoubleRect(-2, -2, 2, 2);

  var simView2 = new SimView('simView2', simRect2);
  var mockViewObsvr2 = new MockViewObserver();
  simView2.addObserver(mockViewObsvr2);
  assertEquals(-1, labCanvas.getViews().indexOf(simView2));
  labCanvas.addView(simView2);
  assertEquals(2, mockLCObsvr.numListModifiedEvents);
  assertEquals(1, mockViewObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(new ScreenRect(0, 0, 500, 300)));
  assertEquals(simView1, labCanvas.getFocusView());
  assertEquals(simView2, labCanvas.getViews()[1]);
  assertEquals(2, labCanvas.getViews().length);
  assertEquals(1, labCanvas.getViews().indexOf(simView2));

  // cannot set focus to an unknown view
  assertThrows(() => labCanvas.setFocusView(new SimView('unknown', simRect2)) );

  // change focus to simView2
  labCanvas.setFocusView(simView2);
  assertEquals(2, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView2, labCanvas.getFocusView());

  // change focus back to simView1
  labCanvas.setFocusView(simView1);
  assertEquals(3, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView1, labCanvas.getFocusView());

  // remove the focus view
  labCanvas.removeView(simView1);
  assertEquals(1, mockLCObsvr.numViewRemovedEvents);
  assertEquals(3, mockLCObsvr.numListModifiedEvents);
  assertEquals(4, mockLCObsvr.numFocusChangedEvents);
  assertEquals(simView2, labCanvas.getFocusView());
  assertEquals(simView2, labCanvas.getViews()[0]);
  assertEquals(1, labCanvas.getViews().length);
  assertEquals(0, labCanvas.getViews().indexOf(simView2));

  assertThrows(() => labCanvas.setSize(0, 0));
  assertThrows(() => labCanvas.setSize(100, 0));
  assertThrows(() => labCanvas.setSize(0, 100));
  assertThrows(() => labCanvas.setSize(100, -1));
  assertThrows(() => labCanvas.setSize(-1, 100));
};

/**  LabCanvas Observer that counts number of times that parameters are changed or
*    events fire.
*/
class MockLCObserver implements Observer {
     numEvents: number = 0;
     numListModifiedEvents: number = 0;
     numFocusChangedEvents: number = 0;
     numViewRemovedEvents: number = 0;
     numBooleans: number = 0;
     numDoubles: number = 0;
     numStrings: number = 0;
  constructor() { };
  observe(event: SubjectEvent) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      if (event.nameEquals(LabCanvas.VIEW_LIST_MODIFIED)) {
        this.numListModifiedEvents++;
      } else if (event.nameEquals(LabCanvas.FOCUS_VIEW_CHANGED)) {
        this.numFocusChangedEvents++;
      } else if (event.nameEquals(LabCanvas.VIEW_REMOVED)) {
        this.numViewRemovedEvents++;
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
    return 'MockLCObserver';
  };
} // end MockLCObserver class

/**  SimView Observer that counts number of times that parameters are changed or
*    events fire.
*/
class MockViewObserver implements Observer {
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
    return 'MockViewObserver';
  };
} // end MockViewObserver class

//  mock CanvasRenderingContext2D
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

//  mock HTMLCanvasElement
class MockCanvas {
     tol: number;
     mockContext_: CanvasRenderingContext2D;
     width: number = 0;
     height: number = 0;
     // kludge so that paint() happens, see LabCanvas.paint()
     offsetParent: object|null = { a: "foobar" };

  constructor(tol: number) {
     this.tol = tol;
     this.mockContext_ = new MockContext2D(tol) as unknown as CanvasRenderingContext2D;
  };
  getContext(contextId: string): CanvasRenderingContext2D {
    assertEquals('2d', contextId);
    return this.mockContext_;
  }
}; // end MockCanvas class
