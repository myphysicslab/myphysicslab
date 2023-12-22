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

import { AbstractODESim, ODESim } from '../../lab/model/ODESim.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { Joint } from '../../lab/engine2D/Joint.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SimList } from '../../lab/model/SimList.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

/** The parts that make up a RigidDoublePendulumSim: two RigidBodys
* and the four Joints that connect them.
*/
export type Parts = {
  bodies: RigidBody[],
  joints: Joint[]
};

const THETA1 = 0;
const THETA1P = 1;
const THETA2 = 2;
const THETA2P = 3;
const KE = 4;
const PE = 5;
const TE = 6;
const TIME = 7;

/** Simulation of a double pendulum as two rigid bodies. This uses {@link RigidBody}'s
and {@link Joint}'s, but only for geometry and display. This does *not* use the general
physics engine {@link lab/engine2D/ContactSim.ContactSim | ContactSim},
instead this is a specialized simulation like
{@link sims/pendulum/DoublePendulumSim.DoublePendulumSim | DoublePendulumSim}.

For derivation of equations of motion, see the paper
[Double Pendulum as Rigid Bodies](../Rigid_Double_Pendulum.pdf)
by Erik Neumann, April 2, 2011.

**TO DO**: explain how and why the angle-1 variable is different from the angle-1 parameter.
Perhaps rename the angle-1 parameter to be omega-1 to reduce confusion. Perhaps
allow setting of the angle-1 variable directly, and then adapt accordingly.

**TO DO**:  figure out what the real rest state is (it is not all zero angles),
which will also fix the energy calculation.

**TO DO**:  add damping

**TO DO**:  derive equations of motion using Lagrangian method

*/
export class RigidDoublePendulumSim extends AbstractODESim implements Simulation, ODESim, EnergySystem {
  /** upper pendulum */
  private pendulum1_: RigidBody;
  /** lower pendulum */
  private pendulum2_: RigidBody;
  /** upper pivot, joins scrim and pendulum1 */
  private pivot1_: Joint;
  /** lower pivot, joins pendulum1 and pendulum2 */
  private pivot2_: Joint;
  /** Angle of R1 with respect to vertical in body coords of pendulum 1.
  * Gamma adjustment angle is needed because vector R1 might not be vertical.
  */
  private gamma1_: number;
  /** Angle of R2 with respect to vertical in body coords of pendulum 2. */
  private gamma2_: number;
  /** initial angle of pendulum 1 */
  private omega1_: number;
  /** initial angle of pendulum 2 */
  private omega2_: number;
  /** distance from pivot 1 to the center of mass of pendulum 1 */
  private R1_: number;
  /** distance from pivot 1 to pivot 2 */
  private L1_: number;
  /** distance from pivot 2 to the center of mass of pendulum 2 */
  private R2_: number;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /** angle from vector r1 to vector l1 */
  private phi_: number;
  /** gravity */
  private gravity_: number = 9.8;

/**
* @param parts the RigidBodys and Joints that make the pendulum.
* @param opt_name name of this as a Subject
* @param opt_simList
*/
constructor(parts: Parts, opt_name?: string, opt_simList?: SimList) {
  super(opt_name, opt_simList);
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  const var_names = [
    RigidDoublePendulumSim.en.ANGLE_1,
    RigidDoublePendulumSim.en.ANGLE_1_VELOCITY,
    RigidDoublePendulumSim.en.ANGLE_2,
    RigidDoublePendulumSim.en.ANGLE_2_VELOCITY,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    RigidDoublePendulumSim.i18n.ANGLE_1,
    RigidDoublePendulumSim.i18n.ANGLE_1_VELOCITY,
    RigidDoublePendulumSim.i18n.ANGLE_2,
    RigidDoublePendulumSim.i18n.ANGLE_2_VELOCITY,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.pendulum1_ = parts.bodies[0];
  this.pendulum2_ = parts.bodies[1];
  this.pivot1_ = parts.joints[0];
  this.pivot2_ = parts.joints[1];
  if (!(this.pivot1_.getBody1() instanceof Scrim)
      || this.pivot1_.getBody2() != this.pendulum1_) {
    throw 'parts error 1';
  }
  if (this.pivot2_.getBody1() != this.pendulum1_
      || this.pivot2_.getBody2() != this.pendulum2_) {
    throw 'parts error 2';
  }
  // might be able to loosen this requirement
  if (!this.pivot1_.getAttach1().equals(Vector.ORIGIN)) {
    throw 'parts error 3';
  }
  this.gamma1_ = RigidDoublePendulumSim.getGamma(this.pendulum1_, this.pivot1_);
  this.gamma2_ = RigidDoublePendulumSim.getGamma(this.pendulum2_, this.pivot2_);
  this.omega1_ = this.pendulum1_.getAngle();
  this.omega2_ = this.pendulum2_.getAngle();
  // figure out initial conditions from angles and angular velocity of pendulums
  const theta1 = this.omega1_ + this.gamma1_;
  const theta1_velocity = this.pendulum1_.getAngularVelocity();
  const theta2 = this.omega2_ + this.gamma2_;
  const theta2_velocity = this.pendulum2_.getAngularVelocity();
  // calculate length of vectors R1, L1, R2
  const c1 = this.pendulum1_.getCenterOfMass();
  const attach1_0 = this.pivot1_.getAttach2();
  const r1 = c1.subtract(attach1_0);
  const l1 = this.pivot2_.getAttach1().subtract(attach1_0);
  const c2 = this.pendulum2_.getCenterOfMass();
  const r2 = c2.subtract(this.pivot2_.getAttach2());
  this.R1_ = r1.length();
  this.L1_ = l1.length();
  this.R2_ = r2.length();
  this.phi_ = r1.angleTo(l1);
  // find zero energy level by moving to rest state
  // (for non-centered version, this is close to rest state, but not quite there).
  const vars = this.getVarsList().getValues();
  vars[THETA1] = 0;
  vars[THETA1P] = 0;
  vars[THETA2] = 0;
  vars[THETA2P] = 0;
  this.getVarsList().setValues(vars);
  this.modifyObjects();
  // set potentialOffset so that PE is zero at rest state
  this.potentialOffset_ = - this.getEnergyInfo().getPotential();
  // move to initial state
  vars[THETA1] = theta1;
  vars[THETA1P] = theta1_velocity;
  vars[THETA2] = theta2;
  vars[THETA2P] = theta2_velocity;
  this.getVarsList().setValues(vars);
  this.saveInitialState();
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, RigidDoublePendulumSim.en.GRAVITY,
      RigidDoublePendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(pn = new ParameterNumber(this, RigidDoublePendulumSim.en.ANGLE_1,
      RigidDoublePendulumSim.i18n.ANGLE_1,
      () => this.getAngle1(), a => this.setAngle1(a)));
  pn.setLowerLimit(-Math.PI);
  pn.setUpperLimit(Math.PI);
  this.addParameter(pn = new ParameterNumber(this, RigidDoublePendulumSim.en.ANGLE_2,
      RigidDoublePendulumSim.i18n.ANGLE_2,
      () => this.getAngle2(), a => this.setAngle2(a)));
  pn.setLowerLimit(-Math.PI);
  pn.setUpperLimit(Math.PI);
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  this.getSimList().add(this.pendulum1_, this.pendulum2_, this.pivot1_, this.pivot2_);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', gamma1_: '+Util.NF(this.gamma1_)
      +', gamma2_: '+Util.NF(this.gamma2_)
      +', pendulum1_: '+this.pendulum1_
      +', pendulum2_: '+this.pendulum2_
      +', gravity_: '+Util.NF(this.gravity_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RigidDoublePendulumSim';
};

/** Creates a double pendulum with offset center of mass and offset joints. The two
rectangular bodies are attached together as a double pendulum. The center of mass of
the upper pendulum is offset from its geometric center. The joint connecting the two
bodies is not along the vertical center line of either body, but is offset.
@param theta1 angle at joint of scrim and pendulum1
@param theta2 angle at joint of pendulum1 and pendulum2
@param pivot location of fixed joint connecting to Scrim, in world coords
*/
static makeOffset(theta1: number, theta2: number, pivot?: Vector): Parts {
  pivot = pivot || Vector.ORIGIN;
  // body coords origin is at lower left corner with makeBlock2
  const p1 = Shapes.makeBlock2(0.3, 1.0, RigidDoublePendulumSim.en.PENDULUM+1,
      RigidDoublePendulumSim.i18n.PENDULUM+1);
  p1.setCenterOfMass(new Vector(p1.getWidth()/3.0, p1.getHeight()*0.3));
  //p1.setDragPoints([ new Vector(p1.getWidth()/2.0, p1.getHeight()*0.2) ]);
  p1.setPosition(new Vector(0,  0),  theta1);
  const p2 = Shapes.makeBlock2(0.3, 1.0, RigidDoublePendulumSim.en.PENDULUM+2,
      RigidDoublePendulumSim.i18n.PENDULUM+2);
  p2.setPosition(new Vector(0,  0),  theta2);
  //p2.setDragPoints([ new Vector(p2.getWidth()/2.0, p2.getHeight()*0.2) ]);
  const scrim = Scrim.getScrim();
  const j1 = new Joint(
      scrim, /*attach_body=*/pivot,
      p1, /*attach_body=*/new Vector(0.5*p1.getWidth(), 0.85*p1.getHeight()),
      CoordType.BODY, /*normal=*/Vector.NORTH
  );
  const j2 = new Joint(
      p1, /*attach1_body=*/new Vector(0.85*p1.getWidth(), 0.15*p1.getHeight()),
      p2, /*attach2_body=*/new Vector(0.15*p2.getWidth(), 0.85*p2.getHeight()),
      CoordType.BODY, /*normal=*/Vector.NORTH
  );
  const j1_1 = new Joint(
      scrim, /*attach_body=*/pivot,
      p1, j1.getAttach2(),
      CoordType.BODY, /*normal=*/Vector.EAST
  );
  const j2_1 = new Joint(
      p1, j2.getAttach1(),
      p2, j2.getAttach2(),
      CoordType.BODY, /*normal=*/Vector.EAST
  );
  return { bodies: [p1, p2], joints: [j1, j2, j1_1, j2_1] };
};

/** Creates a double pendulum with centered mass and joints. The two rectangular bodies
are attached together as a double pendulum. The center of mass is at geometric center of
each pendulum, and joints are along the vertical center line of each body.
@param theta1 angle at joint of scrim and pendulum1
@param theta2 angle at joint of pendulum1 and pendulum2
@param pivot location of fixed joint connecting to Scrim, in world coords
*/
static makeCentered(theta1: number, theta2: number, pivot?: Vector): Parts {
  pivot = pivot || Vector.ORIGIN;
  // (body coords origin is at lower left corner with makeBlock2)
  const p1 = Shapes.makeBlock2(0.3, 1.0, RigidDoublePendulumSim.en.PENDULUM+1,
      RigidDoublePendulumSim.i18n.PENDULUM+1);
  p1.setPosition(new Vector(0,  0),  theta1);
  const p2 = Shapes.makeBlock2(0.3, 1.0, RigidDoublePendulumSim.en.PENDULUM+2,
      RigidDoublePendulumSim.i18n.PENDULUM+2);
  p2.setPosition(new Vector(0,  0),  theta2);
  const scrim = Scrim.getScrim();
  const j1 = new Joint(
      scrim, /*attach_body=*/pivot,
      p1, /*attach_body=*/new Vector(0.5*p1.getWidth(), 0.85*p1.getHeight()),
      CoordType.BODY, /*normal=*/Vector.NORTH
  );
  const j2 = new Joint(
      p1, /*attach1_body=*/new Vector(0.5*p1.getWidth(), 0.15*p1.getHeight()),
      p2, /*attach2_body=*/new Vector(0.5*p2.getWidth(), 0.85*p2.getHeight()),
      CoordType.BODY, /*normal=*/Vector.NORTH
  );
  const j1_1 = new Joint(
      scrim, /*attach_body=*/pivot,
      p1, /*attach_body=*/j1.getAttach2(),
      CoordType.BODY, /*normal=*/Vector.EAST
  );
  const j2_1 = new Joint(
      p1, j2.getAttach1(),
      p2, j2.getAttach2(),
      CoordType.BODY, /*normal=*/Vector.EAST
  );
  return { bodies: [p1, p2], joints: [j1, j2, j1_1, j2_1] };
};

/** Returns angle between vertical (in body coordinates) and the vector from joint to
center of mass of the pendulum. If the pendulum were hanging at rest from the joint
with no forces other than gravity acting, then the angle of the pendulum would be
`-gamma`.
@param pendulum the pendulum RigidBody
@param pivot the Joint that the pendulum is hanging from
@return angle between vertical (in body coordinates) and the vector from
    joint to center of mass of the pendulum
@throws if the pendulum is not one of the bodies of the joint
*/
static getGamma(pendulum: RigidBody, pivot: Joint): number {
  let attach: Vector;
  if (pivot.getBody1() == pendulum) {
    attach = pivot.getAttach1();
  } else if (pivot.getBody2() == pendulum) {
    attach = pivot.getAttach2();
  } else {
    throw 'parts error 4';
  }
  const v = attach.subtract(pendulum.getCenterOfMass());
  return v.getAngle() - Math.PI/2;
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const p1 = this.pendulum1_;
  const p2 = this.pendulum2_;
  const ke = p1.translationalEnergy() + p2.translationalEnergy();
  const re = p1.rotationalEnergy() + p2.rotationalEnergy();
  const pe = this.gravity_ * p1.getMass() * p1.getPosition().getY()
         + this.gravity_ * p2.getMass() * p2.getPosition().getY();
  return new EnergyInfo(pe + this.potentialOffset_, ke, re);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  const ei = this.getEnergyInfo();
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  va.setValue(KE, ei.getTranslational() + ei.getRotational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]): void {
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  const sin_th1 = Math.sin(vars[THETA1]);
  const cos_th1 = Math.cos(vars[THETA1]);
  const sin_th2 = Math.sin(vars[THETA2]);
  const cos_th2 = Math.cos(vars[THETA2]);
  const sin_ph1 = Math.sin(vars[THETA1] + this.phi_);
  const cos_ph1 = Math.cos(vars[THETA1] + this.phi_);
  const R1 = this.R1_;
  const R2 = this.R2_;
  const L1 = this.L1_;
  this.pendulum1_.setPosition(new Vector(R1*sin_th1, -R1*cos_th1),
      vars[THETA1] - this.gamma1_);
  this.pendulum1_.setVelocity(new Vector(vars[THETA1P]*R1*cos_th1, vars[THETA1P]*R1*sin_th1),
      vars[THETA1P]);
  this.pendulum2_.setPosition(new Vector(L1*sin_ph1 + R2*sin_th2,
      -L1*cos_ph1 - R2*cos_th2), vars[THETA2] - this.gamma2_);
  this.pendulum2_.setVelocity(new Vector(vars[THETA1P]*L1*cos_ph1 + vars[THETA2P]*R2*cos_th2,
      vars[THETA1P]*L1*sin_ph1 + vars[THETA2P]*R2*sin_th2), vars[THETA2P]);
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  change[TIME] = 1; // time
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  const th1 = vars[THETA1];
  const dth1 = vars[THETA1P];
  const th2 = vars[THETA2];
  const dth2 = vars[THETA2P];
  const m1 = this.pendulum1_.getMass();
  const m2 = this.pendulum2_.getMass();
  const I1 = this.pendulum1_.momentAboutCM();
  const I2 = this.pendulum2_.momentAboutCM();
  const R1 = this.R1_;
  const R2 = this.R2_;
  const L1 = this.L1_;
  const g = this.gravity_;
  const phi = this.phi_;
  change[THETA1] = dth1;
  change[THETA1P] = -((2*g*m1*R1*(I2 + m2*R2*R2)*Math.sin(th1) +
      L1*m2*(g*(2*I2 + m2*R2*R2)*Math.sin(th1 + phi) +
      R2*(g*m2*R2*Math.sin(th1 - 2*th2 + phi) +
      2*(dth2*dth2*(I2 + m2*R2*R2) +
      dth1*dth1*L1*m2*R2*Math.cos(th1 - th2 + phi))*Math.sin(th1 - th2 + phi))))/
      (2*I2*L1*L1*m2 + 2*I2*m1*R1*R1 + L1*L1*m2*m2*R2*R2 + 2*m1*m2*R1*R1*R2*R2 +
      2*I1*(I2 + m2*R2*R2) - L1*L1*m2*m2*R2*R2*Math.cos(2*(th1 - th2 + phi))));
  change[THETA2] = dth2;
  change[THETA2P] =  (m2*R2*(-(g*(2*I1 + L1*L1*m2 + 2*m1*R1*R1)*Math.sin(th2)) +
      L1*(g*m1*R1*Math.sin(th2 - phi) +
      2*dth1*dth1*(I1 + L1*L1*m2 + m1*R1*R1)*Math.sin(th1 - th2 + phi) +
      dth2*dth2*L1*m2*R2*Math.sin(2*(th1 - th2 + phi)) +
      g*m1*R1*Math.sin(2*th1 - th2 + phi) +
      g*L1*m2*Math.sin(2*th1 - th2 + 2*phi))))/
      (2*I2*L1*L1*m2 + 2*I2*m1*R1*R1 + L1*L1*m2*m2*R2*R2 +
      2*m1*m2*R1*R1*R2*R2 + 2*I1*(I2 + m2*R2*R2) -
      L1*L1*m2*m2*R2*R2*Math.cos(2*(th1 - th2 + phi)));
  return null;
};

/** Returns angle of R1 with respect to vertical in body coords of pendulum 1.
@return angle of R1 with respect to vertical in body coords of pendulum 1.
*/
getGamma1(): number {
  return this.gamma1_;
};

/** Returns angle of R2 with respect to vertical in body coords of pendulum 2.
@return angle of R2 with respect to vertical in body coords of pendulum 2.
*/
getGamma2(): number {
  return this.gamma2_;
};

/**
*/
getGravity(): number {
  return this.gravity_;
};

/**
@param value
*/
setGravity(value: number) {
  this.gravity_ = value;
  // vars  0        1        2       3      4   5   6   7
  //      theta1, theta1', theta2, theta2', ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RigidDoublePendulumSim.en.GRAVITY);
};

/** Set the initial conditions according to the RigidBody angles omega1, omega2.
*/
private setInitialAngles(): void {
  this.reset();
  // figure out the new 'theta' angles
  // theta = omega + gamma, where omega is the rigid body angle.
  const va = this.getVarsList();
  const vars = va.getValues();
  vars[THETA1] = this.omega1_ + this.gamma1_;
  vars[THETA1P] = 0;
  vars[THETA2] = this.omega2_ + this.gamma2_;
  vars[THETA2P] = 0;
  va.setValues(vars);
  this.saveInitialState();
  this.modifyObjects();
};

/**
*/
getAngle1(): number {
  return this.omega1_;
};

/**
@param value
*/
setAngle1(value: number) {
  this.omega1_ = value;
  this.setInitialAngles();
  this.broadcastParameter(RigidDoublePendulumSim.en.ANGLE_1);
};

/**
*/
getAngle2(): number {
  return this.omega2_;
};

/**
@param value
*/
setAngle2(value: number) {
  this.omega2_ = value;
  this.setInitialAngles();
  this.broadcastParameter(RigidDoublePendulumSim.en.ANGLE_2);
};

static readonly en: i18n_strings = {
  ANGLE_1: 'angle-1',
  ANGLE_1_VELOCITY: 'angle-1 velocity',
  ANGLE_2: 'angle-2',
  ANGLE_2_VELOCITY: 'angle-2 velocity',
  GRAVITY: 'gravity',
  MASS_1: 'mass-1',
  MASS_2: 'mass-2',
  ROD_1_LENGTH: 'rod-1 length',
  ROD_2_LENGTH: 'rod-2 length',
  PENDULUM: 'pendulum'
};

static readonly de_strings: i18n_strings = {
  ANGLE_1: 'Winkel-1',
  ANGLE_1_VELOCITY: 'Winkel-1 Geschwindigkeit',
  ANGLE_2: 'Winkel-2',
  ANGLE_2_VELOCITY: 'Winkel-2 Geschwindigkeit',
  GRAVITY: 'Gravitation',
  MASS_1: 'Masse-1',
  MASS_2: 'Masse-2',
  ROD_1_LENGTH: 'Stange-1 Länge',
  ROD_2_LENGTH: 'Stange-2 Länge',
  PENDULUM: 'Pendel'
};

static readonly i18n = Util.LOCALE === 'de' ? RigidDoublePendulumSim.de_strings : RigidDoublePendulumSim.en;

} // end class

type i18n_strings = {
  ANGLE_1: string,
  ANGLE_1_VELOCITY: string,
  ANGLE_2: string,
  ANGLE_2_VELOCITY: string,
  GRAVITY: string,
  MASS_1: string,
  MASS_2: string,
  ROD_1_LENGTH: string,
  ROD_2_LENGTH: string,
  PENDULUM: string
};

Util.defineGlobal('sims$pendulum$RigidDoublePendulumSim', RigidDoublePendulumSim);
