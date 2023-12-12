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

import { CoordType } from '../model/CoordType.js';
import { Force } from '../model/Force.js';
import { ForceLaw } from '../model/ForceLaw.js';
import { MassObject } from '../model/MassObject.js';
import { RigidBody } from './RigidBody.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Contains a set of thrust forces operating on a particular RigidBody; each thruster
generates a Force at a specified location on the RigidBody with a specified direction.
Thrusters can be turned on or off independently. Use {@link ThrusterSet.setMagnitude} to set an overall magnitude which multiplies all of the thrust forces.

Thrusters are set to a default location and direction of the zero vector, see 
{@link Vector.ORIGIN}. Use {@link ThrusterSet.setThruster} to set the
actual location and direction.

See {@link lab/app/RigidBodyEventHandler.RigidBodyEventHandler} for an example of how
to control thrusters from key events.

**TO DO** be able to scale or rotate each Force independently?
*/
export class ThrusterSet implements ForceLaw {
  /** The rigidBody which thrust is applied to. */
  private rigidBody_: RigidBody;
  /** the overall multiplier applied to each thrust Force. */
  private magnitude_: number;
  /** Location on body where thrust force is applied, in body coords. */
  private locations_body_: Vector[];
  /** Direction and magnitude of thrust force, in body coords. */
  private directions_body_: Vector[];
  /** flags indicating which thrusters are currently firing */
  private active_: boolean[];

/**
* @param numThrusters number of thrusters to create
* @param body the RigidBody which thrust is applied to
* @param magnitude the overall multiplier applied to each thrust Force.
*/
constructor(numThrusters: number, body: RigidBody, magnitude: number) {
  this.rigidBody_ = body;
  this.magnitude_ = magnitude;
  this.locations_body_ = Util.repeat(Vector.ORIGIN, numThrusters);
  this.directions_body_ = Util.repeat(Vector.ORIGIN, numThrusters);
  this.active_ = Util.repeat(false, numThrusters);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', thrusters: '+this.active_.length
      +', magnitude: '+Util.NF(this.magnitude_)
      +', locations_body: '+this.locations_body_
      +', directions_body: '+this.directions_body_
      +', active:['+this.active_+']'
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'ThrusterSet{rigidBody_: "'+this.rigidBody_.getName()+'"}';
};

/**  Returns true if any thrusters in the ThrusterSet are firing.
* @return true if any thrusters in the ThrusterSet are firing
*/
anyActive(): boolean {
  for (let i=0; i<this.active_.length; i++) {
    if (this.active_[i])
      return true;
  }
  return false;
};

/** @inheritDoc */
calculateForces(): Force[] {
  const forces = [];
  for (let k=0; k<this.active_.length; k++) {  // for each thruster
    if (this.active_[k]) {
      const v_world = this.rigidBody_.rotateBodyToWorld(this.getDirectionBody(k));
      const p_world = this.rigidBody_.bodyToWorld(this.getLocationBody(k));
      const f = new Force('thruster'+k, this.rigidBody_,
          /*location=*/p_world, CoordType.WORLD,
          /*direction=*/v_world, CoordType.WORLD);
      forces.push(f);
    }
  }
  return forces;
};

/** @inheritDoc */
disconnect(): void {
};

/** Returns true if the given thruster is firing.
* @param index the index number of the thruster within the array of thrusters
* @return true if the given thruster is firing
*/
getActive(index: number): boolean {
  return this.active_[index];
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return [ this.rigidBody_ ];
};

/** Returns direction and magnitude of thrust force, in body coords, for the given
thruster. Returns default value `Vector.ORIGIN` if location not yet defined for that
thruster.
@param index the index number of the desired thruster within the array of thrusters
@return direction and magnitude of thrust force, in body coords
*/
getDirectionBody(index: number): Vector {
  if (index < 0 || index >= this.directions_body_.length)
    throw '';
  return this.directions_body_[index].multiply(this.magnitude_);
};

/** Returns location on body where thrust force is applied for the given thruster.
Returns default value `Vector.ORIGIN` if location not yet defined for that thruster.
@param index the index number of the desired thruster within the array of thrusters
@return location on body where thrust force is applied, in body coords
*/
getLocationBody(index: number): Vector {
  if (index < 0 || index >= this.locations_body_.length)
    throw '';
  return this.locations_body_[index];
};

/** Returns overall multiplier applied to the magnitude of each thrust Force.
* @return the overall multiplier applied to each thrust Force.
*/
getMagnitude(): number {
  return this.magnitude_;
};

/** @inheritDoc */
getPotentialEnergy(): number {
  return 0;
};

/** Sets whether the given thruster is firing.
* @param index the index number of the thruster within the array of thrusters
* @param active  whether the thruster should be firing.
* @return this object for chaining setters
*/
setActive(index: number, active: boolean): ThrusterSet {
  this.active_[index] = active;
  return this;
};

/** Sets an overall multiplier applied to each thrust Force.
@param magnitude  the overall multiplier to apply to each thrust Force.
@return this object for chaining setters
*/
setMagnitude(magnitude: number): ThrusterSet {
  this.magnitude_ = magnitude;
  return this;
};

/** Sets a thruster's location and direction.
* @param index  the index number of the thruster within the array of thrusters
* @param location_body the location to apply the thrust force on the RigidBody,
*     in body coordinates
* @param direction_body the direction and magnitude of the thrust force,
*     in body coordinates
*/
setThruster(index: number, location_body: Vector, direction_body: Vector): void {
  if (index < 0 || index >= this.locations_body_.length)
    throw '';
  this.locations_body_[index] = location_body;
  this.directions_body_[index] = direction_body;
};

} // end ThrusterSet class
Util.defineGlobal('lab$engine2D$ThrusterSet', ThrusterSet);
