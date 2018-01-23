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

goog.provide('myphysicslab.lab.view.test.LabCanvas_test');

goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.VerticalAlign');

/**  LabCanvas Observer that counts number of times that parameters are changed or
*    events fire.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.view.test.LabCanvas_test.MockLCObserver = function() {
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

myphysicslab.lab.view.test.LabCanvas_test.MockLCObserver.prototype.observe = function(event) {
  const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
  const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
  const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
  const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
  if (event instanceof GenericEvent) {
    var LabCanvas = myphysicslab.lab.view.LabCanvas;
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

myphysicslab.lab.view.test.LabCanvas_test.MockLCObserver.prototype.toStringShort = function() {
  return 'MockLCObserver';
};

/**  LabView Observer that counts number of times that parameters are changed or
*    events fire.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.view.test.LabCanvas_test.MockViewObserver = function() {
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

myphysicslab.lab.view.test.LabCanvas_test.MockViewObserver.prototype.observe = function(event) {
  const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
  const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
  const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
  const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
  if (event instanceof GenericEvent) {
    var LabView = myphysicslab.lab.view.LabView;
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

myphysicslab.lab.view.test.LabCanvas_test.MockViewObserver.prototype.toStringShort = function() {
  return 'MockViewObserver';
};

var testLabCanvas1 = function() {
  var tol = 1E-14;
  const AffineTransform = goog.module.get('myphysicslab.lab.util.AffineTransform');
  const CoordMap = goog.module.get('myphysicslab.lab.view.CoordMap');
  const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
  var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
  const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
  const HorizAlign = goog.module.get('myphysicslab.lab.view.HorizAlign');
  var LabCanvas = myphysicslab.lab.view.LabCanvas;
  var MockLCObserver = myphysicslab.lab.view.test.LabCanvas_test.MockLCObserver;
  var MockViewObserver = myphysicslab.lab.view.test.LabCanvas_test.MockViewObserver;
  const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
  const ScreenRect = goog.module.get('myphysicslab.lab.view.ScreenRect');
  const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
  var SimView = myphysicslab.lab.view.SimView;
  const Spring = goog.module.get('myphysicslab.lab.model.Spring');
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  const VerticalAlign = goog.module.get('myphysicslab.lab.view.VerticalAlign');

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
    * @type {!myphysicslab.lab.util.Vector}
    */
    this.lastPoint = Vector.ORIGIN;
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


  /**  mock canvas element
  @constructor
  @extends {HTMLCanvasElement}
  */
  var MockCanvas = function() {
     /** @type {!CanvasRenderingContext2D}
     @private
     */
    this.mockContext_ = new MockContext();
  };
  /** @override */
  MockCanvas.prototype.width = 0;
  /** @override */
  MockCanvas.prototype.height = 0;
  /** @override */
  MockCanvas.prototype.getContext = function(type) {
    assertEquals('2d', type);
    return this.mockContext_;
  }


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

  var mockCanvas = new MockCanvas();
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
  assertEquals(0, goog.array.indexOf(labCanvas.getViews(), simView1));
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
  /** @type {!MockContext}*/
  var mockContext = /** @type {!MockContext}*/(labCanvas.getCanvas().getContext('2d'));
  if (!mockContext) {
    throw new Error();
  }
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
  assertEquals(-1, goog.array.indexOf(labCanvas.getViews(), simView2));
  labCanvas.addView(simView2);
  assertEquals(2, mockLCObsvr.numListModifiedEvents);
  assertEquals(1, mockViewObsvr2.numScreenRectEvents);
  assertTrue(simView2.getScreenRect().equals(new ScreenRect(0, 0, 500, 300)));
  assertEquals(simView1, labCanvas.getFocusView());
  assertEquals(simView2, labCanvas.getViews()[1]);
  assertEquals(2, labCanvas.getViews().length);
  assertEquals(1, goog.array.indexOf(labCanvas.getViews(), simView2));

  // cannot set focus to an unknown view
  assertThrows(function() {
    labCanvas.setFocusView(new SimView('unknown', simRect2));
  });

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
  assertEquals(0, goog.array.indexOf(labCanvas.getViews(), simView2));

  assertThrows(function() { labCanvas.setSize(0, 0); });
  assertThrows(function() { labCanvas.setSize(100, 0); });
  assertThrows(function() { labCanvas.setSize(0, 100); });
  assertThrows(function() { labCanvas.setSize(100, -1); });
  assertThrows(function() { labCanvas.setSize(-1, 100); });
};
goog.exportProperty(window, 'testLabCanvas1', testLabCanvas1);
