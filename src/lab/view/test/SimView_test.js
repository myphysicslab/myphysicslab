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

goog.module('myphysicslab.lab.view.test.SimView_test');

goog.require('goog.array');
goog.require('goog.testing.jsunit');
const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/**  Observer that counts number of times that parameters are changed or
*    events fire.
* @implements {Observer}
*/
class MockObserver {
  constructor() {
    /**
    * @type {number}
    */
    this.numEvents = 0;
    /**
    * @type {number}
    */
    this.numScreenRectEvents = 0;
    /**
    * @type {number}
    */
    this.numSimRectEvents = 0;
    /**
    * @type {number}
    */
    this.numBooleans = 0;
    /**
    * @type {number}
    */
    this.numDoubles = 0;
    /**
    * @type {number}
    */
    this.numStrings = 0;
  };
  /** @override */
  observe(event) {
    if (event instanceof GenericEvent) {
      this.numEvents++;
      if (event.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        this.numScreenRectEvents++;
      } else if (event.nameEquals(LabView.SIM_RECT_CHANGED)) {
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
  /** @override */
  toStringShort() {
    return 'MockObserver';
  };
} // end class

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
    /**  expected rectangle point 1
    * @type {?Vector}
    */
    this.expectRect1 = null;
    /**  expected rectangle point 2
    * @type {?Vector}
    */
    this.expectRect2 = null;
    /**  expected screen coords point
    * @type {?Vector}
    */
    this.startPoint = null;
    /**  last point drawn to
    * @type {!Vector}
    */
    this.lastPoint = Vector.ORIGIN;
    /**
    * @type {!AffineTransform}
    */
    this.at = AffineTransform.IDENTITY;
    /**
    * @type {string}
    */
    this.fillStyle = '';
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
   * @param {number} w
   * @param {number} h
   * @return {undefined}
   */
  rect(x, y, w, h) {
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
  /**
   * @param {number} x
   * @param {number} y
   * @return {undefined}
   */
  moveTo(x, y) {
    var pt1 = this.at.transform(x, y);
    if (this.startPoint != null) {
      // check that the rectangle being drawn matches expected rectangle
      assertRoughlyEquals(this.startPoint.getX(), pt1.getX(), this.tol);
      assertRoughlyEquals(this.startPoint.getY(), pt1.getY(), this.tol);
    }
  };
  /**
   * @param {number} x
   * @param {number} y
   * @return {undefined}
   */
  lineTo(x, y) {
    this.lastPoint = this.at.transform(x, y);
  };
  save() {};
  restore() {
    this.at = AffineTransform.IDENTITY;
  };
  stroke() {};
  beginPath() {};
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @return {undefined}
   */
  clearRect(x, y, w, h) {};
  /**
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @param {number} e
   * @param {number} f
   * @return {undefined}
   */
  setTransform(a, b, c, d, e, f) {
    this.at = new AffineTransform(a, b, c, d, e, f);
  };
  fill() {};
} // end class

/** @suppress {invalidCasts} */
var testSimView1 = function() {
  var tol = 1E-14;
  var mockContext = new MockContext(tol);
  var screenRect = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500,
      /*height=*/300);
  var simRect1 = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
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
  var shape1 = new DisplayShape(point1).setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1).setMass(Util.POSITIVE_INFINITY);
  fixedPt.setPosition(new Vector(-1,  0));
  var spring1 = new Spring('spring1',
      fixedPt, Vector.ORIGIN,
      point1, Vector.ORIGIN,
      /*restLength=*/2, /*stiffness=*/12);
  var dspring1 = new DisplaySpring(spring1).setWidth(1.0)
      .setColorCompressed('red').setColorExpanded('green')

  goog.asserts.assert(v1 instanceof Vector);
  displayList1.add(shape1);
  displayList1.add(dspring1);
  assertTrue(displayList1.contains(shape1));
  assertTrue(displayList1.contains(dspring1));
  assertEquals(2, displayList1.toArray().length);
  assertTrue(goog.array.contains(displayList1.toArray(), shape1));
  assertTrue(goog.array.contains(displayList1.toArray(), dspring1));
  assertEquals(shape1, displayList1.find(point1));
  assertEquals(dspring1, displayList1.find(spring1));

  // set expected rectangle to be drawn
  mockContext.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext.startPoint = map.simToScreen(new Vector(-1, 0));
  simView1.paint(/** @type {!CanvasRenderingContext2D} */(mockContext));
  assertEquals('orange', mockContext.fillStyle);
  assertTrue(mockContext.lastPoint.nearEqual(map.simToScreen(v1)));
  // spring is expanded
  assertEquals('green', mockContext.strokeStyle);

  // make a second 'slave' view
  var simRect2 = new DoubleRect(/*left=*/-2, /*bottom=*/-2, /*right=*/2, /*top=*/2);

  var simView2 = new SimView('simView2', simRect2);
  var mockObsvr2 = new MockObserver();
  simView2.addObserver(mockObsvr2);
  assertTrue(simView2.getSimRect().equals(simRect2));
  simView2.setScreenRect(screenRect);
  assertEquals(1, mockObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(screenRect));

  // this GenericObserver forces simView2 to have same simRect as simView1
  var matcher = new GenericObserver(simView1,
      function(evt) {
        if (evt.nameEquals(LabView.SIM_RECT_CHANGED)) {
          simView2.setSimRect(simView1.getSimRect());
        }
      }, 'match simRect');

  // change simRect1 and check that SimView2 matches
  assertEquals(0, mockObsvr1.numSimRectEvents);
  assertEquals(0, mockObsvr2.numSimRectEvents);
  simRect1 = new DoubleRect(/*left=*/-15, /*bottom=*/-15, /*right=*/15, /*top=*/15);
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
  simRect1 = new DoubleRect(/*left=*/-30, /*bottom=*/-30, /*right=*/30, /*top=*/30);
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
  assertThrows(function() {
    simView1.setHorizAlign((/** @type {!HorizAlign}*/('foo'))); });
  assertThrows(function() {
    simView1.setVerticalAlign((/** @type {!VerticalAlign}*/('foo'))); });

  // remove DisplayObjects from simView1's list of DisplayObjects
  displayList1.remove(shape1);
  assertFalse(displayList1.contains(shape1));
  assertEquals(1, displayList1.toArray().length);
  assertFalse(goog.array.contains(displayList1.toArray(), shape1));

  displayList1.removeAll();
  assertFalse(displayList1.contains(dspring1));
  assertEquals(0, displayList1.toArray().length);
  assertFalse(goog.array.contains(displayList1.toArray(), dspring1));

  assertThrows(function() { new SimView('badView', DoubleRect.EMPTY_RECT); });
};
goog.exportProperty(window, 'testSimView1', testSimView1);
