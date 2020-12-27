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

goog.module('myphysicslab.lab.view.test.LabCanvasTest');

goog.require('goog.array');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
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
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);
const assertNotNull = v => TestRig.assertNotNull(v);

/**  LabCanvas Observer that counts number of times that parameters are changed or
*    events fire.
* @implements {Observer}
*/
class MockLCObserver {
  constructor() {
    /**
    * @type {number}
    */
    this.numEvents = 0;
    /**
    * @type {number}
    */
    this.numListModifiedEvents = 0;
    /**
    * @type {number}
    */
    this.numFocusChangedEvents = 0;
    /**
    * @type {number}
    */
    this.numViewRemovedEvents = 0;
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
  /** @override */
  toStringShort() {
    return 'MockLCObserver';
  };
} // end class

/**  LabView Observer that counts number of times that parameters are changed or
*    events fire.
* @implements {Observer}
*/
class MockViewObserver {
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
    return 'MockViewObserver';
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

/**  mock HTMLCanvasElement
*/
class MockCanvas {
  /**
  * @param {number} tol
  * @suppress {invalidCasts}
  */
  constructor(tol) {
    /**
    * @type {number}
    */
    this.tol = tol;
    /**
    * @type {!CanvasRenderingContext2D}
    */
    this.mockContext_ = /** @type {!CanvasRenderingContext2D} */(new MockContext(tol));
    /**
    * @type {number}
    */
    this.width = 0;
    /**
    * @type {number}
    */
    this.height = 0;
  };
  /**
   * @param {string} contextId
   * @param {Object=} opt_args
   * @return {Object}
   */
  getContext(contextId, opt_args) {
    assertEquals('2d', contextId);
    return this.mockContext_;
  }
} // end class

class LabCanvasTest {

static test() {
  schedule(LabCanvasTest.testLabCanvas1);
};

/** @suppress {invalidCasts} */
static testLabCanvas1() {
  startTest(LabCanvasTest.groupName+'testLabCanvas1');
  var tol = 1E-14;
  var simRect1 = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
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
  var shape1 = new DisplayShape(point1).setFillStyle('orange');
  var fixedPt = PointMass.makeSquare(1).setMass(Util.POSITIVE_INFINITY);
  fixedPt.setPosition(new Vector(-1,  0));
  var spring1 = new Spring('spring1',
      fixedPt, Vector.ORIGIN,
      point1, Vector.ORIGIN,
      /*restLength=*/2, /*stiffness=*/12);
  var dspring1 = new DisplaySpring(spring1).setWidth(1.0)
      .setColorCompressed('red').setColorExpanded('green')
      .setDrawMode(DisplaySpring.STRAIGHT);
  displayList1.add(shape1);
  displayList1.add(dspring1);

  var mockCanvas = /** @type {!HTMLCanvasElement} */(new MockCanvas(tol));
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
  labCanvas.setSize(/*width=*/500, /*height=*/300);
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
  var mockContext = /** @type {!MockContext}*/(labCanvas.getCanvas().getContext('2d'));
  assertNotNull(mockContext);
  mockContext.expectRect1 = map.simToScreen(new Vector(2, -0.5));
  mockContext.expectRect2 = map.simToScreen(new Vector(3, 0.5));
  mockContext.startPoint = map.simToScreen(new Vector(-1, 0));
  labCanvas.getCanvas().offsetParent = document.body; // kludge so that paint() happens
  labCanvas.paint();
  assertEquals('orange', mockContext.fillStyle);
  assertTrue(mockContext.lastPoint.nearEqual(map.simToScreen(v1)));
  // spring is expanded
  assertEquals('green', mockContext.strokeStyle);

  // add a second view
  var simRect2 = new DoubleRect(/*left=*/-2, /*bottom=*/-2, /*right=*/2, /*top=*/2);

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

} // end class

/**
* @type {string}
* @const
*/
LabCanvasTest.groupName = 'LabCanvasTest.';

exports = LabCanvasTest;
