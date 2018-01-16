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

goog.provide('myphysicslab.lab.view.test.CoordMap_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

var testCoordMap = function() {
  var CoordMap = myphysicslab.lab.view.CoordMap;
  const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
  var HorizAlign = myphysicslab.lab.view.HorizAlign;
  var ScreenRect = myphysicslab.lab.view.ScreenRect;
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

  var tol = 1E-13;
  // WIDE screen rect
  var screenRect1 = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500,
      /*height=*/300);
  var screenRect2;
  var simRect1 = new DoubleRect(/*left=*/-10, /*bottom=*/-10, /*right=*/10,
      /*top=*/10);
  var simRect2;

  // WIDE =========  HorizAlign.LEFT, VerticalAlign.FULL ============
  /** @type {!myphysicslab.lab.view.CoordMap} */
  var map = CoordMap.make(screenRect1, simRect1, HorizAlign.LEFT,
      VerticalAlign.FULL);
  var at = map.getAffineTransform();
  var scale = 300/20;

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  var v0 = Vector.ORIGIN;
  var v1 = map.simToScreen(v0);
  var v2 = new Vector(150, 150);
  assertTrue(v1.nearEqual(v2, tol));
  assertTrue(map.screenToSim(v1).nearEqual(v0, tol));
  assertTrue(map.screenToSim(v2).nearEqual(v0, tol));
  assertTrue(at.transform(v0).nearEqual(v2, tol));
  assertRoughlyEquals(150, map.simToScreenX(0), tol);
  assertRoughlyEquals(150, map.simToScreenY(0), tol);

  v0 = new Vector(10, 10);
  v1 = map.simToScreen(v0);
  v2 = new Vector(300, 0);
  assertTrue(v1.nearEqual(v2, tol));
  assertTrue(map.screenToSim(v1).nearEqual(v0, tol));
  assertTrue(map.screenToSim(v2).nearEqual(v0, tol));
  assertTrue(at.transform(v0).nearEqual(v2, tol));

  v0 = new Vector(10, -10);
  v1 = map.simToScreen(v0);
  v2 = new Vector(300, 300);
  assertTrue(v1.nearEqual(v2, tol));
  assertTrue(map.screenToSim(v1).nearEqual(v0, tol));
  assertTrue(map.screenToSim(v2).nearEqual(v0, tol));
  assertTrue(at.transform(v0).nearEqual(v2, tol));

  v0 = new Vector(-10, -10);
  v1 = map.simToScreen(v0);
  v2 = new Vector(0, 300);
  assertTrue(v1.nearEqual(v2, tol));
  assertTrue(map.screenToSim(v1).nearEqual(v0, tol));
  assertTrue(map.screenToSim(v2).nearEqual(v0, tol));
  assertTrue(at.transform(v0).nearEqual(v2, tol));

  v0 = new Vector(-10, 10);
  v1 = map.simToScreen(v0);
  v2 = new Vector(0, 0);
  assertTrue(v1.nearEqual(v2, tol));
  assertTrue(map.screenToSim(v1).nearEqual(v0, tol));
  assertTrue(map.screenToSim(v2).nearEqual(v0, tol));
  assertTrue(at.transform(v0).nearEqual(v2, tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(0, screenRect2.getLeft(), tol);
  assertRoughlyEquals(0, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(150), tol);
  assertRoughlyEquals(0, map.screenToSimY(150), tol);
  assertTrue(map.screenToSim(150, 150).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);

  // WIDE ==========  HorizAlign.RIGHT, VerticalAlign.FULL ============
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.RIGHT,
      VerticalAlign.FULL);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(350, 150), tol));
  //console.log(at.transform(Vector.ORIGIN));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(350, 150), tol));
  assertRoughlyEquals(350, map.simToScreenX(0), tol);
  assertRoughlyEquals(150, map.simToScreenY(0), tol);
  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(500, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(500, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(500, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(200, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(200, 0), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(200, screenRect2.getLeft(), tol);
  assertRoughlyEquals(0, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(350), tol);
  assertRoughlyEquals(0, map.screenToSimY(150), tol);
  assertTrue(map.screenToSim(350, 150).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);


  // WIDE =========  HorizAlign.MIDDLE, VerticalAlign.MIDDLE ===========
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.MIDDLE,
      VerticalAlign.MIDDLE);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(250, 150), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(250, 150), tol));
  assertRoughlyEquals(250, map.simToScreenX(0), tol);
  assertRoughlyEquals(150, map.simToScreenY(0), tol);
  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(400, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(400, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(400, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(100, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(100, 0), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(100, screenRect2.getLeft(), tol);
  assertRoughlyEquals(0, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(250), tol);
  assertRoughlyEquals(0, map.screenToSimY(150), tol);
  assertTrue(map.screenToSim(250, 150).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);


  // WIDE =========  HorizAlign.FULL, VerticalAlign.FULL ===========
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.FULL,
      VerticalAlign.FULL);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(500/20, map.getScaleX(), tol);
  assertRoughlyEquals(300/20, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(250, 150), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(250, 150), tol));
  assertRoughlyEquals(250, map.simToScreenX(0), tol);
  assertRoughlyEquals(150, map.simToScreenY(0), tol);
  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(500, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(500, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(500, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(0, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(0, 0), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(0, screenRect2.getLeft(), tol);
  assertRoughlyEquals(0, screenRect2.getTop(), tol);
  assertRoughlyEquals(500, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(250), tol);
  assertRoughlyEquals(0, map.screenToSimY(150), tol);
  assertTrue(map.screenToSim(250, 150).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(250, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(250), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);

  // TALL and narrow screen rect
  screenRect1 = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/300, /*height=*/500);

  // TALL ===========  HorizAlign.MIDDLE, VerticalAlign.TOP ==============
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.MIDDLE,
      VerticalAlign.TOP);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(150, 150), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(150, 150), tol));
  assertRoughlyEquals(150, map.simToScreenX(0), tol);
  assertRoughlyEquals(150, map.simToScreenY(0), tol);

  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(300, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(300, 0), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(300, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(0, 300), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(0, 0), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(0, screenRect2.getLeft(), tol);
  assertRoughlyEquals(0, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(150), tol);
  assertRoughlyEquals(0, map.screenToSimY(150), tol);
  assertTrue(map.screenToSim(150, 150).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);

  // TALL ==========  HorizAlign.MIDDLE, VerticalAlign.BOTTOM ============
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.MIDDLE,
      VerticalAlign.BOTTOM);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(150, 350), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(150, 350), tol));
  assertRoughlyEquals(150, map.simToScreenX(0), tol);
  assertRoughlyEquals(350, map.simToScreenY(0), tol);
  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(300, 200), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(300, 200), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(300, 500), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(0, 500), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(0, 200), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(0, screenRect2.getLeft(), tol);
  assertRoughlyEquals(200, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(150), tol);
  assertRoughlyEquals(0, map.screenToSimY(350), tol);
  assertTrue(map.screenToSim(150, 350).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);


  // TALL =======  HorizAlign.MIDDLE, VerticalAlign.MIDDLE ========
  map = CoordMap.make(screenRect1, simRect1, HorizAlign.MIDDLE,
      VerticalAlign.MIDDLE);
  at = map.getAffineTransform();

  // getScaleX, getScaleY
  assertRoughlyEquals(scale, map.getScaleX(), tol);
  assertRoughlyEquals(scale, map.getScaleY(), tol);

  // simToScreen, simToScreenX, simToScreenY
  assertTrue(map.simToScreen(Vector.ORIGIN).nearEqual(new Vector(150, 250), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(150, 250), tol));
  assertRoughlyEquals(150, map.simToScreenX(0), tol);
  assertRoughlyEquals(250, map.simToScreenY(0), tol);
  assertTrue(at.transform(new Vector(10, 10)).nearEqual(new Vector(300, 100), tol));
  assertTrue(map.simToScreen(new Vector(10, 10)).nearEqual(new Vector(300, 100), tol));
  assertTrue(map.simToScreen(new Vector(10, -10)).nearEqual(new Vector(300, 400), tol));
  assertTrue(map.simToScreen(new Vector(-10, -10)).nearEqual(new Vector(0, 400), tol));
  assertTrue(map.simToScreen(new Vector(-10, 10)).nearEqual(new Vector(0, 100), tol));

  // simToScreenRect
  screenRect2 = map.simToScreenRect(simRect1);
  assertRoughlyEquals(0, screenRect2.getLeft(), tol);
  assertRoughlyEquals(100, screenRect2.getTop(), tol);
  assertRoughlyEquals(300, screenRect2.getWidth(), tol);
  assertRoughlyEquals(300, screenRect2.getHeight(), tol);

  // screenToSimX, screenToSimY
  assertRoughlyEquals(0, map.screenToSimX(150), tol);
  assertRoughlyEquals(0, map.screenToSimY(250), tol);
  assertTrue(map.screenToSim(150, 250).nearEqual(Vector.ORIGIN, tol));
  assertTrue(map.screenToSim(new Vector(150, 250)).nearEqual(Vector.ORIGIN, tol));

  // screenToSimRect
  simRect2 = map.screenToSimRect(screenRect2);
  assertTrue(simRect2.nearEqual(simRect1, tol));

  // simToScreenScaleX, simToScreenScaleY, screenToSimScaleX, screenToSimScaleY
  assertRoughlyEquals(150, map.simToScreenScaleX(10), tol);
  assertRoughlyEquals(150, map.simToScreenScaleY(10), tol);
  assertRoughlyEquals(10, map.screenToSimScaleX(150), tol);
  assertRoughlyEquals(10, map.screenToSimScaleY(150), tol);

  //check that setting bad alignment value throws an exception
  // (The type casting is needed to fool the compiler into passing bad values).
  assertThrows(function() { map = CoordMap.make(screenRect1, simRect1,
        (/** @type {!HorizAlign}*/('foo')), VerticalAlign.MIDDLE); });
  assertThrows(function() { map = CoordMap.make(screenRect1, simRect1,
        HorizAlign.MIDDLE, (/** @type {!VerticalAlign}*/('foo'))); });
  assertThrows(function() { map = CoordMap.make(screenRect1, simRect1,
        HorizAlign.MIDDLE, VerticalAlign.MIDDLE, -1); });

};
goog.exportProperty(window, 'testCoordMap', testCoordMap);

