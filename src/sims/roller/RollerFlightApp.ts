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
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingStyle } from '../../lab/view/DrawingStyle.js';
import { GenericObserver } from '../../lab/util/Observe.js';
import { HumpPath } from './HumpPath.js';
import { SimView } from '../../lab/view/SimView.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectEvent, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RollerFlightSim } from './RollerFlightSim.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Creates the RollerFlightSim simulation
*/
export class RollerFlightApp extends AbstractApp<RollerFlightSim> implements Subject, SubjectList {

  path: NumericalPath;
  ball1: DisplayShape;
  anchor: DisplayShape;
  spring: DisplaySpring;
  displayPath: DisplayPath;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const path = new NumericalPath(new HumpPath());
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new RollerFlightSim(path);
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  this.path = path;
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);

  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'));
  this.ball1.setFillStyle('blue');
  this.displayList.add(this.ball1);

  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'));
  this.anchor.setFillStyle('red');
  this.displayList.add(this.anchor);

  this.spring = new DisplaySpring(this.simList.getSpring('spring'));
  this.spring.setWidth(0.2);
  this.spring.setColorCompressed('red');
  this.spring.setColorExpanded('#6f6'); /* brighter green */
  this.displayList.add(this.spring);

  this.displayPath = new DisplayPath();
  this.displayPath.setScreenRect(this.simView.getScreenRect());
  this.displayPath.addPath(this.path);
  this.displayList.add(this.displayPath);

  // modify size of display to fit this path
  this.simView.setSimRect(this.path.getBoundsWorld().scale(1.1));

  // change color of ball depending on whether on track or in free flight
  const trackVar = sim.getVarsList().getVariable(6);
  new GenericObserver(sim.getVarsList(), (evt: SubjectEvent) => {
    if (evt == trackVar) {
      this.ball1.setFillStyle(trackVar.getValue() > 0 ? 'blue' : 'red');
    }
  }, 'change color of ball when in free flight');

  // adjust path display when SimView size changes
  new GenericObserver(this.simView, (evt: SubjectEvent) => {
    if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
      this.displayPath.setScreenRect(this.simView.getScreenRect());
    }
  }, 'resize displayPath when screen rect changes');

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(RollerFlightSim.en.ELASTICITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.STICKINESS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.MASS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerFlightSim.en.SPRING_LENGTH);
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
      +', anchor: '+this.anchor.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', path: '+this.path.toStringShort()
      +', displayPath: '+this.displayPath.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerFlightApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('ball1|anchor|spring|path|displayPath',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$roller$RollerFlightApp', RollerFlightApp);
