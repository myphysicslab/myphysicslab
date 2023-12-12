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

import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConstantForceLaw } from '../../lab/model/ConstantForceLaw.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PendulumClockConfig } from './PendulumClockConfig.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Simulates a pendulum clock with a pendulum attached to an anchor that
regulates that turning of an escapement wheel. The escapement wheel has a constant
torque force that causes it to turn continuously.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class PendulumClockApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  pendulumLength: number = 3.0;
  turningForce: number = 1.0;
  extraBody: boolean = false;
  withGears: boolean = false;
  turnForceLaw: null|ForceLaw  = null;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -4, 4, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.sim.setShowForces(true);
  this.dampingLaw = new DampingLaw(0.05, 0.15, this.simList);
  this.gravityLaw = new GravityLaw(10, this.simList);
  this.elasticity.setElasticity(0.3);

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;
  this.addParameter(pb = new ParameterBoolean(this, PendulumClockConfig.en.WITH_GEARS,
      PendulumClockConfig.i18n.WITH_GEARS,
      () => this.getWithGears(), a => this.setWithGears(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PendulumClockConfig.en.EXTRA_BODY,
      PendulumClockConfig.i18n.EXTRA_BODY,
      () => this.getExtraBody(), a => this.setExtraBody(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn=new ParameterNumber(this, PendulumClockConfig.en.PENDULUM_LENGTH,
      PendulumClockConfig.i18n.PENDULUM_LENGTH,
      () => this.getPendulumLength(), a => this.setPendulumLength(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PendulumClockConfig.en.TURNING_FORCE,
      PendulumClockConfig.i18n.TURNING_FORCE,
      () => this.getTurningForce(), a => this.setTurningForce(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'PendulumClockApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PendulumClockApp|Engine2DApp',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @inheritDoc */
override graphSetup(body?: RigidBody): void {
  body = body ?? this.sim.getBody(PendulumClockConfig.en.ANCHOR);
  this.graph.line.setXVariable(body.getVarsIndex()+4);
  this.graph.line.setYVariable(body.getVarsIndex()+5);
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4);
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  if (this.withGears) {
    PendulumClockConfig.makeClockWithGears(this.sim, this.pendulumLength,
        /*center=*/Vector.ORIGIN);
  } else {
    PendulumClockConfig.makeClock(this.sim, this.pendulumLength,
        /*center=*/Vector.ORIGIN);
  }
  const escapeWheel = this.displayList.findShape(PendulumClockConfig.en.ESCAPE_WHEEL);
  escapeWheel.setFillStyle('#D3D3D3');
  if (this.withGears) {
    escapeWheel.setStrokeStyle('black');
    const gear2 = this.displayList.findShape(PendulumClockConfig.en.GEAR+2);
    gear2.setFillStyle('#B0C4DE');
    gear2.setZIndex(2);
  }
  const anchor = this.displayList.findShape(PendulumClockConfig.en.ANCHOR);
  anchor.setFillStyle('#B0C4DE');
  anchor.setZIndex(3);
  this.setTurningForce(this.turningForce);
  if (this.extraBody) {
    // optional free moving block, to demonstrate interactions.
    const block = Shapes.makeBlock(/*width=*/0.12, /*height=*/0.5,
        PendulumClockConfig.en.EXTRA_BODY, PendulumClockConfig.i18n.EXTRA_BODY);
    block.setMass(0.3);
    block.setPosition(new Vector(0, 6), Math.PI/2);
    this.sim.addBody(block);
    this.displayList.findShape(block).setStrokeStyle('cyan');
  }
  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
*/
getWithGears(): boolean {
  return this.withGears;
};

/**
* @param value
*/
setWithGears(value: boolean) {
  this.withGears = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.WITH_GEARS);
};

/**
*/
getExtraBody(): boolean {
  return this.extraBody;
};

/**
* @param value
*/
setExtraBody(value: boolean) {
  this.extraBody = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.EXTRA_BODY);
};

/**
*/
getPendulumLength(): number {
  return this.pendulumLength;
};

/**
* @param value
*/
setPendulumLength(value: number) {
  this.pendulumLength = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.PENDULUM_LENGTH);
};

/**
*/
getTurningForce(): number {
  return this.turningForce;
};

/**
* @param value
*/
setTurningForce(value: number) {
  this.turningForce = value;
  if (this.turnForceLaw != null) {
    this.sim.removeForceLaw(this.turnForceLaw);
  }
  const body = this.sim.getBody(PendulumClockConfig.en.ESCAPE_WHEEL);
  if (body) {
    const f = new Force('turning', body,
        /*location=*/body.getDragPoints()[0], CoordType.BODY,
        /*direction=*/new Vector(value, 0), CoordType.BODY);
    this.turnForceLaw = new ConstantForceLaw(f);
    this.sim.addForceLaw(this.turnForceLaw);
  }
  this.broadcastParameter(PendulumClockConfig.en.TURNING_FORCE);
};

} // end class
