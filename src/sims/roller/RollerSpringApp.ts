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
import { CardioidPath } from './CardioidPath.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CirclePath } from './CirclePath.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { FlatPath } from './FlatPath.js';
import { HumpPath } from './HumpPath.js';
import { LemniscatePath } from './LemniscatePath.js';
import { LoopTheLoopPath } from './LoopTheLoopPath.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer, ParameterNumber, ParameterString, Subject,
    SubjectEvent, SubjectList } from '../../lab/util/Observe.js';
import { OvalPath } from './OvalPath.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { PathObserver } from './PathObserver.js';
import { PathSelector } from './PathSelector.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RollerSingleSim } from './RollerSingleSim.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SpiralPath } from './SpiralPath.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Creates the {@link RollerSingleSim} simulation with a spring.

*/
export class RollerSpringApp extends AbstractApp<RollerSingleSim> implements Subject, SubjectList, Observer {
  ball1: DisplayShape;
  anchor: DisplayShape;
  spring: DisplaySpring;
  pathSelect: PathSelector;
  pathObserver: PathObserver;
  paths: ParametricPath[];

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new RollerSingleSim(/*hasSpring=*/true);
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'));
  this.ball1.setFillStyle('blue');
  this.displayList.add(this.ball1);
  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'));
  this.anchor.setFillStyle('red');
  this.displayList.add(this.anchor);
  let ds = new DisplaySpring(this.simList.getSpring('spring'));
  ds.setWidth(0.2);
  ds.setColorCompressed('#f00');
  ds.setColorExpanded('#6f6'); /* brighter green */
  this.spring = ds;
  this.displayList.add(this.spring);
  this.paths = [
      new HumpPath(),
      new LoopTheLoopPath(),
      new CirclePath(3.0),
      new OvalPath(),
      new LemniscatePath(2.0),
      new CardioidPath(3.0),
      new SpiralPath(),
      new FlatPath()
  ];
  this.pathSelect = new PathSelector(sim, this.paths);
  this.pathObserver = new PathObserver(this.simList, this.simView,
      a => this.setSimRect(a));
  this.pathSelect.setPathName(HumpPath.en.NAME);

  this.addPlaybackControls();
  let ps = this.pathSelect.getParameterString(PathSelector.en.PATH);
  this.addControl(new ChoiceControl(ps));
  let pn = sim.getParameterNumber(RollerSingleSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.MASS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.SPRING_LENGTH);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.SPRING_DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeEasyScript([this.simView]);
  this.addURLScriptButton();
  this.pathSelect.addObserver(this);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', anchor: '+this.anchor.toStringShort()
      +', ball1: '+this.ball1.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', pathSelect: '+this.pathSelect.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerSpringApp';
};

/** @inheritDoc */
override defineNames(myName: string) {
  super.defineNames(myName);
  this.terminal.addRegex('ball1|anchor|spring|paths|pathSelect',
      myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.pathSelect);
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.pathSelect) {
    this.easyScript.update();
    this.sim.modifyObjects();
  }
};

/**
@param simRect
*/
setSimRect(simRect: DoubleRect): void {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

} // end class
Util.defineGlobal('sims$roller$RollerSpringApp', RollerSpringApp);
