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

goog.module('myphysicslab.lab.engine2D.LocalCoords');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Remembers the local coordinate system of a
* {@link myphysicslab.lab.model.MassObject}. Used during collision checking to
* compare previous and current locations of objects.
*/
class LocalCoords {
constructor() {
  /** center of mass in body coordinates
  * @type {!Vector}
  * @protected
  */
  this.cm_body_ = Vector.ORIGIN;
  /**
  * @type {!Vector}
  * @protected
  */
  this.loc_world_ = Vector.ORIGIN;
  /** sine of angle
  * @type {number}
  * @protected
  */
  this.sinAngle_ = 0.0;
  /** cosine of angle.
  * @type {number}
  * @protected
  */
  this.cosAngle_ = 1.0;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'LocalCoords{'
      +'loc_world_: '+this.loc_world_
      +', cm_body_: '+this.cm_body_
      +', sinAngle_: '+Util.NF(this.sinAngle_)
      +', cosAngle_: '+Util.NF(this.cosAngle_)
      +'}';
};

/** Returns the world coordinates of the given body coordinates point, based on current
position of the object.
@param {!GenericVector} p_body  the point, in body coordinates
@return {!Vector} the point in world coordinates
*/
bodyToWorld(p_body) {
  const rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  const ry = p_body.getY() - this.cm_body_.getY();
  const vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  const vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** Sets the values that define the local coordinate system.
* @param {!Vector} cm_body center of mass of the object in body coordinates
* @param {!Vector} loc_world location of center of mass in world coordinates
* @param {number} sinAngle sine of angle of rotation about center of mass
* @param {number} cosAngle cosine of angle of rotation about center of mass
*/
set(cm_body, loc_world, sinAngle, cosAngle) {
  this.cm_body_ = cm_body;
  this.loc_world_ = loc_world;
  this.sinAngle_ = sinAngle;
  this.cosAngle_ = cosAngle;
};

/** Returns the body coordinates of the given world coordinates point, based on current
position of the object.
@param {!GenericVector} p_world  the point, in world coordinates
@return {!Vector} the point in body coordinates
*/
worldToBody(p_world) {
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
exports = LocalCoords;
