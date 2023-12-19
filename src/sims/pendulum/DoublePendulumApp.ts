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

import { AbstractApp } from '../common/AbstractApp.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoublePendulumSim } from './DoublePendulumSim.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link DoublePendulumSim} simulation.
*/
export class DoublePendulumApp extends AbstractApp<DoublePendulumSim> implements Subject, SubjectList {
  rod1: DisplayLine;
  rod2: DisplayLine;
  bob1: DisplayShape;
  bob2: DisplayShape;
  marker1: PointMass;
  marker1Shape: DisplayShape;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  const sim = new DoublePendulumSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.rod1 = new DisplayLine(this.simList.getConcreteLine('rod1'));
  this.displayList.add(this.rod1);
  this.rod2 = new DisplayLine(this.simList.getConcreteLine('rod2'));
  this.displayList.add(this.rod2);
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'));
  this.bob1.setFillStyle('blue');
  this.displayList.add(this.bob1);
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'));
  this.bob2.setFillStyle('blue');
  this.displayList.add(this.bob2);

  // make a dragable square to use for marking positions
  // This is a test for MouseTracker, the case where a dragable DisplayObject
  // has a SimObject that is not recognized by the Simulation's EventHandler.
  if (1 == 1) {
    this.marker1 = PointMass.makeCircle(0.2, 'marker1');
    // put the object outside of the visible area, to avoid confusion
    this.marker1.setPosition(new Vector(-3, 1));
    this.marker1Shape = new DisplayShape(this.marker1)
    this.marker1Shape.setFillStyle('');
    this.marker1Shape.setStrokeStyle('red');
    this.marker1Shape.setDragable(true);
    this.displayList.add(this.marker1Shape);
  }

  this.graph.line.setXVariable(0); // angle-1
  this.graph.line.setYVariable(2); // angle-2
  // @ts-ignore
  if (0 == 1) {
    // test of polar graph feature
    this.graph.line.xTransform = function(x,y) { return y*Math.cos(x); };
    this.graph.line.yTransform = function(x,y) { return y*Math.sin(x); };
  }
  this.addPlaybackControls();
  let pn: ParameterNumber;
  pn = sim.getParameterNumber(DoublePendulumSim.en.ROD_1_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DoublePendulumSim.en.ROD_2_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DoublePendulumSim.en.MASS_1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoublePendulumSim.en.MASS_2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', rod1: '+this.rod2.toStringShort()
      +', rod2: '+this.rod2.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DoublePendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('rod1|rod2|bob1|bob2',
      myName+'.');
  this.terminal.addRegex('DoublePendulumSim',
       'sims$pendulum$', /*addToVars=*/false);
};

} // end class
Util.defineGlobal('sims$pendulum$DoublePendulumApp', DoublePendulumApp);
