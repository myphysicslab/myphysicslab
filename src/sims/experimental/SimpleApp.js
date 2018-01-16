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

goog.provide('myphysicslab.sims.experimental.SimpleApp');

goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Timer');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.SimView');

/**  Simple App is a demo of using a minimal set of myPhysicsLab classes.

This displays something like the SingleSpringSim simulation, but it uses a very simple
math routine to move the objects instead of a differential equation. There are no
DiffEqSolver or Simulation classes involved. This sets up the LabCanvas and
DisplayObjects and defines a callback that drives the animation.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.experimental.SimpleApp = function() {
  throw new Error();
};

/**
* @return {undefined}
* @export
*/
myphysicslab.sims.experimental.SimpleApp.makeApp = function() {
  var Clock = myphysicslab.lab.util.Clock;
  var DisplayShape = myphysicslab.lab.view.DisplayShape;
  var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
  var DoubleRect = myphysicslab.lab.util.DoubleRect;
  var LabCanvas = myphysicslab.lab.view.LabCanvas;
  var PointMass = myphysicslab.lab.model.PointMass;
  var Spring = myphysicslab.lab.model.Spring;
  var SimView = myphysicslab.lab.view.SimView;
  var Timer = myphysicslab.lab.util.Timer;
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');

  Util.setErrorHandler();
  // create a canvas for displaying the view objects
  var canvas_div = window.document.getElementById('canvas_div');
  if (!canvas_div) {
    throw new Error();
  }
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  var simCanvas = new LabCanvas(canvas, 'canvas1');
  simCanvas.setSize(500, 300);
  canvas_div.appendChild(simCanvas.getCanvas());

  // create the model objects for the spring, block and fixed mass.
  var point1 = PointMass.makeRectangle(1, 1.5, 'block');
  var fixedPt = PointMass.makeSquare(1, 'fixed').setMass(Util.POSITIVE_INFINITY);
  fixedPt.setPosition(new Vector(-4, 0));
  // connect the spring between the fixed mass and the moveable block.
  var spring1 = new Spring('spring',
      fixedPt, Vector.ORIGIN,
      point1, Vector.ORIGIN,
      /*restLength=*/1, /*stiffness=*/3);

  // make view objects that track the block and spring model objects
  var simRect = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
  var simView = new SimView('simView', simRect);
  var shape1 = new DisplayShape(point1).setFillStyle('orange');
  simView.getDisplayList().add(shape1);
  var dspring = new DisplaySpring(spring1).setWidth(1.0).setColorCompressed('yellow')
      .setColorExpanded('blue');
  simView.getDisplayList().add(dspring);
  simCanvas.addView(simView);

  // create the callback that drives the animation
  var clock = new Clock();
  var timer = new Timer();
  timer.setCallBack(function() {
    point1.setPosition(new Vector(1 + 3*Math.sin(3*clock.getTime()), 0));
    simCanvas.paint();
  });
  timer.startFiring();
  clock.resume();
};
