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

goog.provide('myphysicslab.lab.model.Arc');

goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var AbstractSimObject = myphysicslab.lab.model.AbstractSimObject;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** A {@link myphysicslab.lab.model.SimObject} that represents a semi-circular arc.

* @param {string} name name of this SimObject
* @param {number} startAngle  starting position of arc, in radians where zero
*     corresponds to 3 o'clock, `pi/2` corresponds to 12 o'clock.
* @param {number} radius  radius of arc, in simulation coords
* @param {!Vector} center  center of arc, in simulation coords
* @constructor
* @final
* @struct
* @extends {AbstractSimObject}
*/
myphysicslab.lab.model.Arc = function(name, startAngle, radius, center) {
  AbstractSimObject.call(this, name);
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
var Arc = myphysicslab.lab.model.Arc;
goog.inherits(Arc, AbstractSimObject);

if (!Util.ADVANCED) {
  /** @override */
  Arc.prototype.toString = function() {
    return Arc.superClass_.toString.call(this).slice(0, -1)
        +', startAngle_: '+Util.NF(this.startAngle_)
        +', angle_: '+Util.NF(this.angle_)
        +', radius_: '+Util.NF(this.radius_)
        +', center_: '+this.center_
        +'}';
  };
};

/** @override */
Arc.prototype.getClassName = function() {
  return 'Arc';
};

/** Returns angle in radians, where positive is counter-clockwise.
@return {number} angle in radians, where positive is counter-clockwise
*/
Arc.prototype.getAngle = function() {
  return this.angle_;
};

/** @override */
Arc.prototype.getBoundsWorld = function() {
  return DoubleRect.makeCentered(this.center_, this.radius_, this.radius_);
};

/** Returns center of arc, in simulation coords.
@return {!Vector} center of arc, in simulation coords
*/
Arc.prototype.getCenter = function() {
  return this.center_;
};

/** Returns radius of arc, in simulation coords.
@return {number} radius of arc, in simulation coords
*/
Arc.prototype.getRadius = function() {
  return this.radius_;
};

/** Returns starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@return {number} starting angle in radians
*/
Arc.prototype.getStartAngle = function() {
  return this.startAngle_;
};

/** Sets angle in radians, where positive is counter-clockwise.
@param {number} angle angle in radians, where positive is counter-clockwise.
*/
Arc.prototype.setAngle = function(angle) {
  this.angle_ = angle;
};

/** Sets center of arc, in simulation coords.
@param {!Vector} center center of arc, in simulation coords.
*/
Arc.prototype.setCenter = function(center) {
  this.center_ = center;
};

/** Sets radius of arc, in simulation coords.
@param {number} radius radius of arc, in simulation coords.
*/
Arc.prototype.setRadius = function(radius) {
  this.radius_ = radius;
};

/** Sets starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@param {number} angle starting angle in radians
*/
Arc.prototype.setStartAngle = function(angle) {
  this.startAngle_ = angle;
};

/** @override */
Arc.prototype.similar = function(obj, opt_tolerance) {
  if (!(obj instanceof Arc)) {
    return false;
  }
  var arc = /** @type {!Arc} */ (obj);
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

}); // goog.scope
