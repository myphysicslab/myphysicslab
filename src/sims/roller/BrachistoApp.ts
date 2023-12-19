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
import { BrachistoObserver } from './BrachistoObserver.js';
import { BrachistoPaths, BrachistochronePath, LinearPath, CircleArcPath, Brachistochrone2Path, ParabolaUpPath, ParabolaDownPath  } from './BrachistoPaths.js';
import { BrachistoSim } from './BrachistoSim.js';
import { ClockTask } from '../../lab/util/Clock.js';
import { CommonControls } from '../common/CommonControls.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { GenericObserver, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link BrachistoSim} simulation which shows a ball sliding down various
curved paths to see which path is fastest.

The various curves shown are defined in the {@link BrachistoPaths} module.
The Mathematica notebook [Brachistochrone Curves(../Brachistochrone_Curves.pdf) shows how
the curves were chosen. The goal is to find a variety of curves that start at
the origin (0, 0) and pass thru the point (3, -2).
*/
export class BrachistoApp extends AbstractApp<BrachistoSim> implements Subject, SubjectList {

  paths: ParametricPath[];
  /** BrachistoObserver handles making all DisplayObjects */
  brachistoObserver: BrachistoObserver;
  /** This 'repeat' ClockTask will reset the sim every 6 seconds. */
  task: ClockTask;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const paths = [
      new BrachistochronePath(),
      new LinearPath(),
      new CircleArcPath(),
      new Brachistochrone2Path(),
      new ParabolaUpPath(),
      new ParabolaDownPath()
    ];
  const simRect = new DoubleRect(-1, -3, 7, 1);
  const sim = new BrachistoSim(paths);
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*enerygSystem=*/null);

  this.paths = paths;
  this.brachistoObserver = new BrachistoObserver(sim, this.simList, this.simView,
      this.statusView);

  // start clock running when path is chosen; or pause clock in 'choose path' state
  new GenericObserver(sim, (evt: SubjectEvent) => {
    if (evt.nameEquals(BrachistoSim.PATH_CHOSEN)) {
      this.clock.setTime(0);
      this.clock.setRealTime(0);
      const choice = evt.getValue() as number;
      if (choice == -1) {
        this.clock.pause();
      } else {
        this.clock.resume();
      }
    }
  }, 'start clock when path chosen');

  // reset path choice when 'restart' button is pressed
  new GenericObserver(this.simRun, (evt: SubjectEvent) => {
    if (evt.nameEquals(SimRunner.RESET)) {
      sim.setPathChoice(-1);
    }
  }, 'reset path choice when reset occurs');

  sim.setPathChoice(-1);
  this.task = this.makeTask(6);
  this.clock.addTask(this.task);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(BrachistoSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(BrachistoSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(BrachistoSim.en.MASS);
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, BrachistoApp.en.REPEAT_TIME,
      BrachistoApp.i18n.REPEAT_TIME,
      () => this.getRepeatTime(), a => this.setRepeatTime(a)));
  pn.setSignifDigits(0);
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
    +', brachistoObserver: '+this.brachistoObserver.toStringShort()
    +', paths: [ '+this.paths+' ]'
    + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'BrachistoApp';
};

/**
*/
getRepeatTime(): number {
  return this.task.getTime();
};

/**
* @param time
*/
private makeTask(time: number): ClockTask {
  return new ClockTask(time, () => {
      this.sim.reset();
      this.clock.setTime(0);
      this.clock.setRealTime(0);
  });
};

/** Restart sim when reaching the repeat time.
* @param value
*/
setRepeatTime(value: number) {
  this.clock.removeTask(this.task);
  this.task = this.makeTask(value);
  this.clock.addTask(this.task);
  this.sim.reset();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.broadcastParameter(BrachistoApp.en.REPEAT_TIME);
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('brachistoObserver|paths',
      myName+'.');
  this.terminal.addRegex('LinearPath|BrachistochronePath|'+
      'ParabolaUpPath|Brachistochrone2Path|ParabolaDownPath|CircleArcPath',
      'sims$roller$');
};

/** @inheritDoc */
override setup(): void {
  super.setup();
  this.clock.pause();
};

static readonly en: i18n_strings = {
  REPEAT_TIME: 'repeat time'
};

static readonly de_strings: i18n_strings = {
  REPEAT_TIME: 'Intervallwiederholung'
};

static readonly i18n = Util.LOCALE === 'de' ? BrachistoApp.de_strings : BrachistoApp.en;

} // end class

type i18n_strings = {
  REPEAT_TIME: string
};
Util.defineGlobal('sims$roller$BrachistoApp', BrachistoApp);
