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
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { GearsConfig } from './GearsConfig.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** Simulation of two interlocking gears. One of the gears has a constant turning
force applied.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class GearsApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  twoGears: boolean = true;
  turningForce: number = 0.2;
  pinnedGears: boolean = true;
  gearLeft: RigidBody;
  gearRight: null|RigidBody = null;
  turnForceLaw: null|ForceLaw  = null;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -6, 8, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.elasticity.setElasticity(0.3);
  this.sim.setShowForces(true);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.gravityLaw = new GravityLaw(0, this.simList);

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;
  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.PINNED_GEARS,
      GearsConfig.i18n.PINNED_GEARS,
      () => this.getPinnedGears(), a => this.setPinnedGears(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.TWO_GEARS,
      GearsConfig.i18n.TWO_GEARS,
      () => this.getTwoGears(), a => this.setTwoGears(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, GearsConfig.en.TURNING_FORCE,
      GearsConfig.i18n.TURNING_FORCE,
      () => this.getTurningForce(), a => this.setTurningForce(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.makeEasyScript();
  this.addStandardControls();
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
  return 'GearsApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('GearsApp|Engine2DApp',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @inheritDoc */
override graphSetup(body?: RigidBody): void {
  body = this.sim.getBody(GearsConfig.en.LEFT_GEAR);
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
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

  this.gearLeft = GearsConfig.makeGear(2.7, [], GearsConfig.en.LEFT_GEAR,
      GearsConfig.i18n.LEFT_GEAR);
  this.gearLeft.setPosition(new Vector(0,  0),  0);
  this.gearLeft.setMass(1);
  this.sim.addBody(this.gearLeft);
  this.displayList.findShape(this.gearLeft).setFillStyle('lightGray');
  if (this.twoGears) {
    this.gearRight = GearsConfig.makeGear(2.7, [], GearsConfig.en.RIGHT_GEAR,
        GearsConfig.i18n.RIGHT_GEAR);
    const tooth = 2*Math.PI/36;
    this.gearRight.setPosition(new Vector((2 * 2.7) +0.008+0.35, 0), -tooth/5);
    this.sim.addBody(this.gearRight);
    this.displayList.findShape(this.gearRight).setFillStyle('lightGray');
  } else {
    this.gearRight = null;
  }
  if (this.pinnedGears) {
    // gears pinned with joints to background
    JointUtil.attachFixedPoint(this.sim, this.gearLeft, Vector.ORIGIN,
        CoordType.WORLD);
    this.gearLeft.setZeroEnergyLevel();
    if (this.gearRight != null) {
      JointUtil.attachFixedPoint(this.sim, this.gearRight, Vector.ORIGIN,
          CoordType.WORLD);
      this.gearRight.setZeroEnergyLevel();
    }
    this.gravityLaw.setGravity(0);
  } else {
    // gears freely moving, dropping onto floor
    const zel = Walls.make(this.sim, /*width=*/60, /*height=*/12, /*thickness=*/1.0);
    this.gravityLaw.setZeroEnergyLevel(zel);
    this.gravityLaw.setGravity(3);
  }
  this.sim.setElasticity(elasticity);
  this.setTurningForce(this.turningForce);

  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
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
  if (this.gearLeft) {
    const f = new Force('turning', this.gearLeft,
        /*location=*/this.gearLeft.getDragPoints()[0], CoordType.BODY,
        /*direction=*/new Vector(value, 0), CoordType.BODY);
    this.turnForceLaw = new ConstantForceLaw(f);
    this.sim.addForceLaw(this.turnForceLaw);
  }
  this.broadcastParameter(GearsConfig.en.TURNING_FORCE);
};

/** @return */
getPinnedGears(): boolean {
  return this.pinnedGears;
};

/** @param value */
setPinnedGears(value: boolean) {
  this.pinnedGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.PINNED_GEARS);
};

/** @return */
getTwoGears(): boolean {
  return this.twoGears;
};

/** @param value */
setTwoGears(value: boolean) {
  this.twoGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.TWO_GEARS);
};

} // end class
