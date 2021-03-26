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

goog.module('myphysicslab.lab.model.Arc');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A {@link myphysicslab.lab.model.SimObject} that represents a semi-circular arc.
*/
class Arc extends AbstractSimObject {
/**
* @param {string} name name of this SimObject
* @param {number} startAngle  starting position of arc, in radians where zero
*     corresponds to 3 o'clock, `pi/2` corresponds to 12 o'clock.
* @param {number} radius  radius of arc, in simulation coords
* @param {!Vector} center  center of arc, in simulation coords
*/
constructor(name, startAngle, radius, center) {
  super(name);
  /** Starting position of arc, in radians where zero
  * corresponds to 3 o'clock, `pi/2` corresponds to 12 o'clock.
  * @type {number}
  * @private
  */
  this.startAngle_ = startAngle;
  /** Angle in radians, where positive is counter-clockwise.
  * @type {number}
  * @private
  */
  this.angle_ = 0;
  /** radius of arc, in simulation coords
  * @type {number}
  * @private
  */
  this.radius_ = radius;
  /** center of arc, in simulation coords
  * @type {!Vector}
  * @private
  */
  this.center_ = center;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', startAngle_: '+Util.NF(this.startAngle_)
      +', angle_: '+Util.NF(this.angle_)
      +', radius_: '+Util.NF(this.radius_)
      +', center_: '+this.center_
      +'}';
};

/** @override */
getClassName() {
  return 'Arc';
};

/** Returns angle in radians, where positive is counter-clockwise.
@return {number} angle in radians, where positive is counter-clockwise
*/
getAngle() {
  return this.angle_;
};

/** @override */
getBoundsWorld() {
  return DoubleRect.makeCentered(this.center_, this.radius_, this.radius_);
};

/** Returns center of arc, in simulation coords.
@return {!Vector} center of arc, in simulation coords
*/
getCenter() {
  return this.center_;
};

/** Returns radius of arc, in simulation coords.
@return {number} radius of arc, in simulation coords
*/
getRadius() {
  return this.radius_;
};

/** Returns starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@return {number} starting angle in radians
*/
getStartAngle() {
  return this.startAngle_;
};

/** Sets angle in radians, where positive is counter-clockwise.
@param {number} angle angle in radians, where positive is counter-clockwise.
*/
setAngle(angle) {
  this.angle_ = angle;
  this.setChanged();
};

/** Sets center of arc, in simulation coords.
@param {!Vector} center center of arc, in simulation coords.
*/
setCenter(center) {
  this.center_ = center;
  this.setChanged();
};

/** Sets radius of arc, in simulation coords.
@param {number} radius radius of arc, in simulation coords.
*/
setRadius(radius) {
  this.radius_ = radius;
  this.setChanged();
};

/** Sets starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@param {number} angle starting angle in radians
*/
setStartAngle(angle) {
  this.startAngle_ = angle;
  this.setChanged();
};

/** @override */
similar(obj, opt_tolerance) {
  if (!(obj instanceof Arc)) {
    return false;
  }
  const arc = /** @type {!Arc} */ (obj);
  if (Util.veryDifferent(arc.startAngle_, this.startAngle_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(arc.angle_, this.angle_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(arc.radius_, this.radius_, opt_tolerance)) {
    return false;
  }
  return arc.getCenter().nearEqual(this.center_, opt_tolerance);
};

} // end class
exports = Arc;
