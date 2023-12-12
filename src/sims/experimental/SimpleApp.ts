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

import { Clock } from "../../lab/util/Clock.js"
import { DisplayShape } from "../../lab/view/DisplayShape.js"
import { DisplaySpring } from "../../lab/view/DisplaySpring.js"
import { DoubleRect } from "../../lab/util/DoubleRect.js"
import { LabCanvas } from "../../lab/view/LabCanvas.js"
import { PointMass } from "../../lab/model/PointMass.js"
import { Spring } from "../../lab/model/Spring.js"
import { SimView } from "../../lab/view/SimView.js"
import { Timer } from "../../lab/util/Timer.js"
import { Util } from "../../lab/util/Util.js"
import { Vector } from "../../lab/util/Vector.js"

/**  Simple App is a demo of using a minimal set of myPhysicsLab classes.

This displays something like the SingleSpringSim simulation, but it uses a very simple
math routine to move the objects instead of a differential equation. There are no
DiffEqSolver or Simulation classes involved. This sets up the LabCanvas and
DisplayObjects and defines a callback that drives the animation.
*/
export function makeSimpleApp(): void {

  Util.setErrorHandler();
  // create a canvas for displaying the view objects
  const canvas_div = window.document.getElementById('canvas_div');
  if (!canvas_div) {
    throw '';
  }
  const canvas = document.createElement('canvas');
  const simCanvas = new LabCanvas(canvas, 'canvas1');
  simCanvas.setSize(500, 300);
  canvas_div.appendChild(canvas);

  // create the model objects for the spring, block and fixed mass.
  const block1 = PointMass.makeRectangle(1, 1.5, 'block1');
  const fixedPt = PointMass.makeSquare(1, 'fixed');
  fixedPt.setMass(Infinity);
  fixedPt.setPosition(new Vector(-4, 0));
  // connect the spring between the fixed mass and the moveable block.
  const spring1 = new Spring('spring', fixedPt, Vector.ORIGIN, block1, Vector.ORIGIN,
      /*restLength=*/1, /*stiffness=*/3);
  
  // make view objects that track the block and spring model objects
  const simRect = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
  const simView = new SimView('simView', simRect);
  const shape1 = new DisplayShape(block1);
  shape1.setFillStyle('orange');
  simView.getDisplayList().add(shape1);
  const dspring = new DisplaySpring(spring1);
  dspring.setWidth(1.0);
  dspring.setColorCompressed('yellow');
  dspring.setColorExpanded('blue');
  simView.getDisplayList().add(dspring);
  simCanvas.addView(simView);

  // create the callback that drives the animation
  const clock = new Clock();
  const timer = new Timer();
  timer.setCallBack(() => {
    block1.setPosition(new Vector(1 + 3*Math.sin(3*clock.getTime()), 0));
    simCanvas.paint();
  });
  timer.startFiring();
  clock.resume();
};
