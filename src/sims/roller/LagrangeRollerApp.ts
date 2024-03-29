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
import { ElementIDs } from '../common/Layout.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingStyle } from '../../lab/view/DrawingStyle.js';
import { LagrangeRollerSim } from './LagrangeRollerSim.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { Subject, SubjectList } from '../../lab/util/Observe.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Shows the {@link LagrangeRollerSim} simulation.
*/
export class LagrangeRollerApp extends AbstractApp<LagrangeRollerSim> implements Subject, SubjectList {

  ball1: DisplayShape;
  displayPath: DisplayPath;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new LagrangeRollerSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.simRect = sim.getPath().getBoundsWorld().scale(1.2);
  this.simView.setSimRect(this.simRect);

  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'));
  this.ball1.setFillStyle('blue');
  this.displayList.add(this.ball1);

  this.displayPath = new DisplayPath();
  this.displayPath.setScreenRect(this.simView.getScreenRect());
  this.displayPath.setZIndex(-1);
  this.displayList.add(this.displayPath);
  this.displayPath.addPath(sim.getPath(),
      DrawingStyle.lineStyle('gray', /*lineWidth=*/4));

  this.addPlaybackControls();

  let pn = sim.getParameterNumber(LagrangeRollerSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(LagrangeRollerSim.en.MASS);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', ball1: '+this.ball1.toStringShort()
      +', displayPath: '+this.displayPath.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'LagrangeRollerApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('ball1',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$roller$LagrangeRollerApp', LagrangeRollerApp);
