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
import { Layout, ElementIDs } from '../common/Layout.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayRobotWheel } from './DisplayRobotWheel.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { Force } from '../../lab/model/Force.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer, ParameterBoolean, ParameterNumber, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RobotSpeedSim } from './RobotSpeedSim.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { TabLayout3, LayoutOptions } from '../common/TabLayout3.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link RobotSpeedSim} simulation.
*/
export class RobotSpeedApp extends AbstractApp<RobotSpeedSim> implements Subject, SubjectList, Observer {
  ramp: DisplayShape;
  robot: DisplayShape;
  wheelf: DisplayRobotWheel;
  wheelr: DisplayRobotWheel;
  memo: GenericMemo;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param opt_name name of this as a Subject
*/
constructor(elem_ids: ElementIDs, opt_name?: string) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-0.7, -0.4, 2.5, 1.3);
  const sim = new RobotSpeedSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/null,
      /*energySystem=*/null, opt_name);

  this.ramp = new DisplayShape(this.simList.getPointMass('ramp'));
  this.ramp.setFillStyle('black');
  this.displayList.add(this.ramp);
  const bot = this.simList.getPointMass('robot');
  this.robot = new DisplayShape(bot);
  this.robot.setFillStyle('lightGray');
  this.robot.setDrawCenterOfMass(true);
  this.displayList.add(this.robot);
  this.wheelf = new DisplayRobotWheel(this.simList.getPointMass('wheelf'));
  this.displayList.add(this.wheelf);
  this.wheelr = new DisplayRobotWheel(this.simList.getPointMass('wheelr'));
  this.displayList.add(this.wheelr);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(RobotSpeedSim.en.DIAMETER);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.MASS);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.TORQUE);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.FREE_SPEED);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.SLOPE);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.COEF_FRICTION);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.CENTER_OF_MASS);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));

  // pause simulation when bot goes too far in either direction
  this.memo = new GenericMemo(() => {
    const p = bot.getPosition().getX();
    if (p < -0.5 || p > 6)
      this.simRun.pause();
  });
  this.simRun.addMemo(this.memo);
  this.simRun.setTimeStep(0.01);
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  this.graph.line.setXVariable(2);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(4);
  this.timeGraph.line3.setYVariable(5);
  this.timeGraph.autoScale.setTimeWindow(2);
  this.sim.getSimList().addObserver(this);
  this.getParameterBoolean('PAN_ZOOM').setValue(true);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', robot: '+this.robot.toStringShort()
      +', ramp: '+this.ramp.toStringShort()
      +', wheelf: '+this.wheelf.toStringShort()
      +', wheelr: '+this.wheelr.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RobotSpeedApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('body|ramp|wheelf|wheelr',
      myName+'.');
};

/** @inheritDoc */
override makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  const layout = new TabLayout3(elem_ids, canvasWidth, canvasHeight);
  layout.setLayout(LayoutOptions.TIME_GRAPH_AND_SIM);
  return layout;
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.sim.getSimList()) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.find(obj)) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Force) {
        const dl = new DisplayLine(obj).setThickness(1);
        dl.setColor('blue');
        dl.setZIndex(10);
        this.displayList.add(dl);
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d) {
        this.displayList.remove(d);
      }
    }
  }
};

} // end class
