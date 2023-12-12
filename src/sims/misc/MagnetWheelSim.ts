// Copyright 2020 Erik Neumann.  All Rights Reserved.
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
import { CoordType } from '../../lab/model/CoordType.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { Force } from '../../lab/model/Force.js';
import { ParameterNumber } from '../../lab/util/Observe.js'
import { PointMass } from '../../lab/model/PointMass.js';
import { MagnetWheel } from './MagnetWheel.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';

const ANGLE = 0;
const ANGLEP = 1;
const TIME = 2;
const KE = 3;
const PE = 4;
const TE = 5;

/** Simulation of a {@link MagnetWheel} with several magnets
around its edge. The wheel can spin, and the magnets are attracted to a fixed magnet
near the edge. You can give the wheel some extra spin force using the right or left
arrow keys.

*/
export class MagnetWheelSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  private wheel_: MagnetWheel;
  private damping_: number = 0.7;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  private isDragging: boolean = false;
  private keyLeft_: boolean = false;
  private keyRight_: boolean = false;
  private keyForce_: number = 5;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  const var_names = [
    MagnetWheelSim.en.ANGLE,
    MagnetWheelSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    MagnetWheelSim.i18n.ANGLE,
    MagnetWheelSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE,PE,TE);
  this.wheel_ = new MagnetWheel(1, 'wheel');

  this.saveInitialState();
  this.getSimList().add(this.wheel_);

  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.DAMPING,
      MagnetWheelSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.MASS,
      MagnetWheelSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.MAGNET_STRENGTH,
      MagnetWheelSim.i18n.MAGNET_STRENGTH,
      () => this.getMagnetStrength(),
      a => this.setMagnetStrength(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', wheel_: '+this.wheel_
      +', damping_: '+Util.NF(this.damping_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MagnetWheelSim';
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const re = this.wheel_.rotationalEnergy();
  const pe = this.wheel_.getPotentialEnergy() + this.potentialOffset_;
  return new EnergyInfo(pe, 0, re);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  const ei = this.getEnergyInfo();
  vars[KE] = ei.getRotational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param vars
*/
private moveObjects(vars: number[]): void {
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  this.wheel_.setAngle(vars[ANGLE]);
  this.wheel_.setAngularVelocity(vars[ANGLEP]);
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.wheel_) {
    this.isDragging = true;
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.isDragging = false;
};

/** @inheritDoc */
handleKeyEvent(evt: KeyboardEvent, pressed: boolean, modifiers: ModifierKeys): void {
  if (modifiers.control || modifiers.meta || modifiers.alt)
    return;
  switch (evt.key) {
    case "ArrowLeft":
    case "J":
    case "j":
      this.keyLeft_ = pressed;
      evt.preventDefault();
      break;
    case "ArrowRight":
    case "L":
    case "l":
      this.keyRight_ = pressed;
      evt.preventDefault();
      break;
    default:
      break;
  }
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  Util.zeroArray(change);
  // technically it's rotational inertia we should use here, not mass.
  const m = this.wheel_.getMass();

  change[ANGLE] = vars[ANGLEP];
  change[ANGLEP] = -this.damping_*vars[ANGLEP]/m;
  change[TIME] = 1.0;  // time

  this.moveObjects(vars);
  // the fixed magnet is at (xf, yf)
  const fm = this.wheel_.getFixedMagnet();
  const magnets = this.wheel_.getMagnets();
  this.wheel_.calculateForces().forEach(f => {
    change[ANGLEP] += f.getTorque()/m;
    // Add force to SimList, so that it can be displayed.
    // The force should disappear immediately after it is displayed.
    f.setExpireTime(this.getTime());
    this.getSimList().add(f);
  });
  // add constant force while left or right arrow key is pressed
  // (note that we are ignoring mass here).
  if (this.keyLeft_) {
    change[ANGLEP] += this.keyForce_;
  } else if (this.keyRight_) {
    change[ANGLEP] += -this.keyForce_;
  }
  return null;
};

/**
*/
getMass(): number {
  return this.wheel_.getMass();
};

/**
@param value
*/
setMass(value: number): void {
  this.wheel_.setMass(value);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MagnetWheelSim.en.MASS);
};

/**
*/
getDamping(): number {
  return this.damping_;
};

/**
@param value
*/
setDamping(value: number): void {
  this.damping_ = value;
  this.broadcastParameter(MagnetWheelSim.en.DAMPING);
};

/**
*/
getMagnetStrength(): number {
  return this.wheel_.getMagnetStrength();
};

/**
@param value
*/
setMagnetStrength(value: number): void {
  this.wheel_.setMagnetStrength(value);
  this.broadcastParameter(MagnetWheelSim.en.MAGNET_STRENGTH);
};

/**
*/
getMagnetWheel(): MagnetWheel {
  return this.wheel_;
};

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  MASS: 'mass',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angular velocity',
  MAGNET_STRENGTH: 'magnet strength',
  NUM_MAGNETS: 'number of magnets',
  SYMMETRIC: 'symmetric',
  MAGNET_ANGLE: 'angle between magnets'
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  MASS: 'Masse',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkel Geschwindigkeit',
  MAGNET_STRENGTH: 'Magnet Stärke',
  NUM_MAGNETS: 'Anzahl Magnete',
  SYMMETRIC: 'symmetrisch',
  MAGNET_ANGLE: 'Winkel zwischen Magnete'
};

static readonly i18n = Util.LOCALE === 'de' ? MagnetWheelSim.de_strings : MagnetWheelSim.en;

} // end class

type i18n_strings = {
  DAMPING: string,
  MASS: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  MAGNET_STRENGTH: string,
  NUM_MAGNETS: string,
  SYMMETRIC: string,
  MAGNET_ANGLE: string
};

Util.defineGlobal('sims$misc$MagnetWheelSim', MagnetWheelSim);
