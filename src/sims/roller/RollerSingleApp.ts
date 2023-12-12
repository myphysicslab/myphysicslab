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
import { CardioidPath } from './CardioidPath.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CirclePath } from './CirclePath.js';
import { CommonControls } from '../common/CommonControls.js';
import { CustomPath } from './CustomPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
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
import { TextControl } from '../../lab/controls/TextControl.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Creates the {@link RollerSingleSim} simulation with no spring.

Allows defining a parametric equation to define the path. The parameter is `t` which
can be used in JavaScript expressions for Parameters `EQUATION_X` and `EQUATION_Y`.
*/
export class RollerSingleApp extends AbstractApp<RollerSingleSim> implements Subject, SubjectList, Observer {
  ball1: DisplayShape;
  customPath_: CustomPath;
  paths: ParametricPath[];
  pathSelect: PathSelector;
  pathObserver: PathObserver;
/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new RollerSingleSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('white');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);

  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'));
  this.ball1.setFillStyle('blue');
  this.displayList.add(this.ball1);
  this.customPath_ = new CustomPath();
  this.paths = [
      new HumpPath(),
      new LoopTheLoopPath(),
      new CirclePath(3.0),
      new OvalPath(),
      new LemniscatePath(2.0),
      new CardioidPath(3.0),
      new SpiralPath(),
      new FlatPath(),
      this.customPath_
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

  this.addParameter(ps = new ParameterString(this, RollerSingleApp.en.EQUATION_X,
      RollerSingleApp.i18n.EQUATION_X,
      () => this.getXEquation(), a => this.setXEquation(a))
      .setSuggestedLength(30));
  this.addControl(new TextControl(ps));
  this.addParameter(ps = new ParameterString(this, RollerSingleApp.en.EQUATION_Y,
      RollerSingleApp.i18n.EQUATION_Y,
      () => this.getYEquation(), a => this.setYEquation(a))
      .setSuggestedLength(30));
  this.addControl(new TextControl(ps));
  this.addParameter(pn = new ParameterNumber(this, RollerSingleApp.en.START_T_VALUE,
      RollerSingleApp.i18n.START_T_VALUE,
      () => this.getStartTValue(), a => this.setStartTValue(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, RollerSingleApp.en.FINISH_T_VALUE,
      RollerSingleApp.i18n.FINISH_T_VALUE,
      () => this.getFinishTValue(), a => this.setFinishTValue(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
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
      +', ball1: '+this.ball1.toStringShort()
      +', pathSelect: '+this.pathSelect.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerSingleApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('ball1|paths|pathSelect',
      myName+'.', /*addToVars*/true);
};

/** The ending value for `t` in the parameteric equation defining the path.
* @return ending value for `t`
*/
getFinishTValue(): number {
  return this.customPath_.getFinishTValue();
};

/** The starting value for `t` in the parameteric equation defining the path.
* @return starting value for `t`
*/
getStartTValue(): number {
  return this.customPath_.getStartTValue();
};

/** The ending value for `t` in the parameteric equation defining the path.
* @param value ending value for `t`
*/
setFinishTValue(value: number) {
  this.customPath_.setFinishTValue(value);
  this.pathSelect.setPathName(this.customPath_.getName());
  this.pathSelect.update();
  this.broadcastParameter(RollerSingleApp.en.FINISH_T_VALUE);
};

/** The starting value for `t` in the parameteric equation defining the path.
* @param value starting value for `t`
*/
setStartTValue(value: number) {
  this.customPath_.setStartTValue(value);
  this.pathSelect.setPathName(this.customPath_.getName());
  this.pathSelect.update();
  this.broadcastParameter(RollerSingleApp.en.START_T_VALUE);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.pathSelect);
};

/** Returns the parameteric X equation defining the path.
* @return the parameteric X equation defining the path
*/
getXEquation(): string {
  return this.customPath_.getXEquation();
};

/** Returns the parameteric Y equation defining the path.
* @return the parameteric Y equation defining the path
*/
getYEquation(): string {
  return this.customPath_.getYEquation();
};

/** Sets the parametric X equation defining the path. A JavaScript expression where
* the parameter is `t`.
* @param value the parameteric X equation defining the path
*/
setXEquation(value: string) {
  // test this by entering equation like: 'window'
  const oldValue = this.getXEquation();
  try {
    // test this by entering equations like: '3/0' or 'Math.log(-t)'.
    this.customPath_.setXEquation(value);
    this.pathSelect.setPathName(this.customPath_.getName());
    this.pathSelect.update();
    this.broadcastParameter(RollerSingleApp.en.EQUATION_X);
  } catch(ex) {
    // restore the old X-equation
    this.customPath_.setXEquation(oldValue);
    this.pathSelect.update();
    throw ex;
  }
};

/** Sets the parametric Y equation defining the path. A JavaScript expression where
* the parameter is `t`.
* @param value the parameteric Y equation defining the path
*/
setYEquation(value: string) {
  const oldValue = this.getYEquation();
  try {
    this.customPath_.setYEquation(value);
    this.pathSelect.setPathName(this.customPath_.getName());
    this.pathSelect.update();
    this.broadcastParameter(RollerSingleApp.en.EQUATION_Y);
  } catch(ex) {
    // restore the old Y-equation
    this.customPath_.setYEquation(oldValue);
    this.pathSelect.update();
    throw ex;
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.pathSelect) {
    if (this.pathSelect.getPathName() == 'LEMNISCATE') {
      // give Lemniscate some starting velocity
      this.easyScript.parse('velocity=5');
    }
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

static readonly en: i18n_strings = {
  EQUATION_X: 'X-equation',
  EQUATION_Y: 'Y-equation',
  START_T_VALUE: 'start-t',
  FINISH_T_VALUE: 'finish-t'
};

static readonly de_strings: i18n_strings = {
  EQUATION_X: 'X-Gleichung',
  EQUATION_Y: 'Y-Gleichung',
  START_T_VALUE: 'anfangs-t',
  FINISH_T_VALUE: 'ende-t'
};

static readonly i18n = Util.LOCALE === 'de' ? RollerSingleApp.de_strings : RollerSingleApp.en;

} // end class

type i18n_strings = {
  EQUATION_X: string,
  EQUATION_Y: string,
  START_T_VALUE: string,
  FINISH_T_VALUE: string
};
