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

goog.provide('myphysicslab.lab.model.Impulse');

goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Line');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const AbstractSimObject = goog.module.get('myphysicslab.lab.model.AbstractSimObject');
var CoordType = myphysicslab.lab.model.CoordType;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const MassObject = goog.module.get('myphysicslab.lab.model.MassObject');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** An Impulse is a sudden change in momentum, it acts on a given {@link MassObject}
at a defined location and with a defined direction and magnitude.

The method {@link #getStartPoint} gives the location in world coordinates where the
Impulse is applied. The method {@link #getVector} gives the direction and magnitude of
the Impulse in world coordinates.

@param {string} name  string indicating the type of impulse
@param {!MassObject} body the MassObject that the Impulse is
    applied to
@param {number} magnitude the size of the impulse
@param {!Vector} location the location on the body where the impulse
    is applied, in world coordinates
@param {!Vector} direction a unit Vector giving the direction and
    magnitude of the Impulse, in world coordinates
@param {!Vector} offset vector from CM (center of mass) of body to point of impact,
    in world coords
* @constructor
* @final
* @struct
* @extends {AbstractSimObject}
* @implements {myphysicslab.lab.model.Line}
*/
myphysicslab.lab.model.Impulse = function(name, body, magnitude, location, direction,
      offset) {
  AbstractSimObject.call(this, name);
  /** which body the impulse is applied to
  * @type {!MassObject}
  * @private
  */
  this.body_ = body;
  /** magnitude of impulse
  * @type {number}
  * @private
  */
  this.magnitude_ = magnitude;
  /**  where the impulse is applied, in world coords
  * @type {!Vector}
  * @private
  */
  this.location_ = location;
  /** direction of impulse, a unit vector, in world coords
  * @type {!Vector}
  * @private
  */
  this.direction_ = direction;
  /** offset vector from CM (center of mass) of body to point of impact,
  * in world coords
  * @type {!Vector}
  * @private
  */
  this.offset_ = offset;
};
var Impulse = myphysicslab.lab.model.Impulse;
goog.inherits(Impulse, AbstractSimObject);

/** @override */
Impulse.prototype.toString = function() {
  return Util.ADVANCED ? '' :
      Impulse.superClass_.toString.call(this).slice(0, -1)
      +', body: "'+this.body_.getName()+'"'
      +', magnitude_: '+Util.NF5E(this.magnitude_)
      +', location_: '+this.location_
      +', direction_: '+this.direction_
      +', offset_: '+this.offset_
      +'}';
};

/** @override */
Impulse.prototype.getClassName = function() {
  return 'Impulse';
};

/** The body to which this Impulse is applied.
* @return {!MassObject} The MassObject to which this impulse is applied
*/
Impulse.prototype.getBody = function() {
  return this.body_;
};

/** @override */
Impulse.prototype.getBoundsWorld = function() {
  return DoubleRect.make(this.location_, this.getEndPoint());
};

/** @override */
Impulse.prototype.getEndPoint = function() {
  return this.location_.add(this.direction_);
};

/** @override */
Impulse.prototype.getStartPoint = function() {
  return this.location_;
};

/** Returns the magnitude of the impulse.
* @return {number} the magnitude of the impulse.
*/
Impulse.prototype.getMagnitude = function() {
  return this.magnitude_;
};

/** Returns the offset vector from CM (center of mass) of body to point of impact,
* in world coords
* @return {!Vector} the offset vector of the impulse.
*/
Impulse.prototype.getOffset = function() {
  return this.offset_;
};

/** @override */
Impulse.prototype.getVector = function() {
  return this.direction_;
};

/** @override */
Impulse.prototype.similar = function(obj, opt_tolerance) {
  if (!(obj instanceof Impulse)) {
    return false;
  }
  if (obj.getName() != this.getName()) {
    return false;
  }
  var f = /** @type {!Impulse} */(obj);
  if (!this.location_.nearEqual(f.getStartPoint(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.magnitude_, f.getMagnitude(), opt_tolerance)) {
    return false;
  }
  if (!this.direction_.nearEqual(f.getVector(), opt_tolerance)) {
    return false;
  }
  return this.offset_.nearEqual(f.getOffset(), opt_tolerance);
};

}); // goog.scope
