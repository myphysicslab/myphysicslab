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

import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';

/** Remembers the local coordinate system of a
* {@link lab/model/MassObject.MassObject}. Used during collision checking to
* compare previous and current locations of objects.
*/
export class LocalCoords {
  /** center of mass in body coordinates */
  protected cm_body_: Vector = Vector.ORIGIN;
  /** */
  protected loc_world_: Vector = Vector.ORIGIN;
  /** sine of angle */
  protected sinAngle_: number = 0.0;
  /** cosine of angle. */
  protected cosAngle_: number = 1.0;

constructor() { };

/** @inheritDoc */
toString() {
  return 'LocalCoords{'
      +'loc_world_: '+this.loc_world_
      +', cm_body_: '+this.cm_body_
      +', sinAngle_: '+Util.NF(this.sinAngle_)
      +', cosAngle_: '+Util.NF(this.cosAngle_)
      +'}';
};

/** Returns the world coordinates of the given body coordinates point, based on current
position of the object.
@param p_body  the point, in body coordinates
@return the point in world coordinates
*/
bodyToWorld(p_body: GenericVector): Vector {
  const rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  const ry = p_body.getY() - this.cm_body_.getY();
  const vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  const vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** Sets the values that define the local coordinate system.
* @param cm_body center of mass of the object in body coordinates
* @param loc_world location of center of mass in world coordinates
* @param sinAngle sine of angle of rotation about center of mass
* @param cosAngle cosine of angle of rotation about center of mass
*/
set(cm_body: Vector, loc_world: Vector, sinAngle: number, cosAngle: number) {
  this.cm_body_ = cm_body;
  this.loc_world_ = loc_world;
  this.sinAngle_ = sinAngle;
  this.cosAngle_ = cosAngle;
};

/** Returns the body coordinates of the given world coordinates point, based on current
position of the object.
@param p_world  the point, in world coordinates
@return the point in body coordinates
*/
worldToBody(p_world: GenericVector): Vector {
  // get the vector from cm (which is at x_world,y_world) to p_world
  const rx = p_world.getX() - this.loc_world_.getX();
  const ry = p_world.getY() - this.loc_world_.getY();
  const sin = -this.sinAngle_;
  const cos = this.cosAngle_;
  // add the reverse-rotated vector to the cm location (in body-coords)
  const vx = this.cm_body_.getX() + (rx*cos - ry*sin);
  const vy = this.cm_body_.getY() + (rx*sin + ry*cos);
  return new Vector(vx, vy);
};

} // end class
Util.defineGlobal('lab$engine2D$LocalCoords', LocalCoords);
