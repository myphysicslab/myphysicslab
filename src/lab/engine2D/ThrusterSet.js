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

goog.provide('myphysicslab.lab.engine2D.ThrusterSet');

goog.require('goog.array');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var CoordType = myphysicslab.lab.model.CoordType;
var Force = myphysicslab.lab.model.Force;
var ForceLaw = myphysicslab.lab.model.ForceLaw;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var Vector = myphysicslab.lab.util.Vector;

/** Contains a set of thrust forces operating on a particular RigidBody; each thruster
generates a Force at a specified location on the RigidBody with a specified direction.
Thrusters can be turned on or off independently. Use {@link #setMagnitude} to set an
overall magnitude which multiplies all of the thrust forces.

Thrusters are set to a default location and direction of the zero vector, see
{@link Vector#ORIGIN}. Use {@link #setThruster} to set the actual
location and direction.

See {@link myphysicslab.lab.app.RigidBodyEventHandler} for an example of how to control
thrusters from key events.

@todo be able to scale or rotate each Force independently?

* @param {number} numThrusters number of thrusters to create
* @param {!RigidBody} body the RigidBody which thrust is applied to
* @param {number} magnitude the overall multiplier applied to each thrust Force.
* @constructor
* @final
* @struct
* @implements {ForceLaw}
*/
myphysicslab.lab.engine2D.ThrusterSet = function(numThrusters, body, magnitude) {
  /** The rigidBody which thrust is applied to.
  * @type {!RigidBody}
  * @private
  */
  this.rigidBody_ = body;
  /** the overall multiplier applied to each thrust Force.
  * @type {number}
  * @private
  */
  this.magnitude_ = magnitude;
  /** Location on body where thrust force is applied, in body coords.
  * @type {!Array<!Vector>}
  * @private
  */
  this.locations_body_ = goog.array.repeat(Vector.ORIGIN, numThrusters);
  /** Direction and magnitude of thrust force, in body coords.
  * @type {!Array<!Vector>}
  * @private
  */
  this.directions_body_ = goog.array.repeat(Vector.ORIGIN, numThrusters);
  /** flags indicating which thrusters are currently firing
  * @type {!Array<boolean>}
  * @private
  */
  this.active_ = goog.array.repeat(false, numThrusters);
};
var ThrusterSet = myphysicslab.lab.engine2D.ThrusterSet;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ThrusterSet.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', thrusters: '+this.active_.length
        +', magnitude: '+Util.NF(this.magnitude_)
        +', locations_body: '+this.locations_body_
        +', directions_body: '+this.directions_body_
        +', active:['+this.active_+']'
        +'}';
  };

  /** @inheritDoc */
  ThrusterSet.prototype.toStringShort = function() {
    return 'ThrusterSet{rigidBody_: "'+this.rigidBody_.getName()+'"}';
  };
};

/**  Returns true if any thrusters in the ThrusterSet are firing.
* @return {boolean} true if any thrusters in the ThrusterSet are firing
*/
ThrusterSet.prototype.anyActive  = function() {
  for (var i=0; i<this.active_.length; i++) {
    if (this.active_[i])
      return true;
  }
  return false;
};

/** @inheritDoc */
ThrusterSet.prototype.calculateForces  = function() {
  var forces = [];
  for (var k=0; k<this.active_.length; k++) {  // for each thruster
    if (this.active_[k]) {
      var v_world = this.rigidBody_.rotateBodyToWorld(this.getDirectionBody(k));
      var p_world = this.rigidBody_.bodyToWorld(this.getLocationBody(k));
      var f = new Force('thruster'+k, this.rigidBody_,
          /*location=*/p_world, CoordType.WORLD,
          /*direction=*/v_world, CoordType.WORLD);
      forces.push(f);
    }
  }
  return forces;
};

/** @inheritDoc */
ThrusterSet.prototype.disconnect = function() {
};

/** Returns true if the given thruster is firing.
* @param {number} index the index number of the thruster within the array of thrusters
* @return {boolean} true if the given thruster is firing
*/
ThrusterSet.prototype.getActive  = function(index) {
  return this.active_[index];
};

/** @inheritDoc */
ThrusterSet.prototype.getBodies = function() {
  return [ this.rigidBody_ ];
};

/** Returns direction and magnitude of thrust force, in body coords, for the given
thruster. Returns default value `Vector.ORIGIN` if location not yet defined for that
thruster.
@param {number} index the index number of the desired thruster within the
    array of thrusters
@return {!Vector} direction and magnitude of thrust force, in body coords
*/
ThrusterSet.prototype.getDirectionBody  = function(index) {
  if (index < 0 || index >= this.directions_body_.length)
    throw new Error();
  return this.directions_body_[index].multiply(this.magnitude_);
};

/** Returns location on body where thrust force is applied for the given thruster.
Returns default value `Vector.ORIGIN` if location not yet defined for that thruster.
@param {number}index the index number of the desired thruster within the
    array of thrusters
@return {!Vector} location on body where thrust force is applied, in body coords
*/
ThrusterSet.prototype.getLocationBody  = function(index) {
  if (index < 0 || index >= this.locations_body_.length)
    throw new Error();
  return this.locations_body_[index];
};

/** Returns overall multiplier applied to the magnitude of each thrust Force.
* @return {number} the overall multiplier applied to each thrust Force.
*/
ThrusterSet.prototype.getMagnitude  = function() {
  return this.magnitude_;
};

/** @inheritDoc */
ThrusterSet.prototype.getPotentialEnergy  = function() {
  return 0;
};

/** Sets whether the given thruster is firing.
* @param {number} index the index number of the thruster within the array of thrusters
* @param {boolean} active  whether the thruster should be firing.
* @return {!ThrusterSet} this object for chaining setters
*/
ThrusterSet.prototype.setActive  = function(index, active) {
  this.active_[index] = active;
  return this;
};

/** Sets an overall multiplier applied to each thrust Force.
@param {number} magnitude  the overall multiplier to apply to each thrust Force.
@return {!ThrusterSet} this object for chaining setters
*/
ThrusterSet.prototype.setMagnitude  = function(magnitude) {
  this.magnitude_ = magnitude;
  return this;
};

/** Sets a thruster's location and direction.
* @param {number} index  the index number of the thruster within the array of thrusters
* @param {!Vector} location_body the location to apply the thrust
  force on the RigidBody, in body coordinates
* @param {!Vector} direction_body the direction and magnitude of
  the thrust force, in body coordinates
*/
ThrusterSet.prototype.setThruster  = function(index, location_body, direction_body) {
  if (index < 0 || index >= this.locations_body_.length)
    throw new Error();
  this.locations_body_[index] = location_body;
  this.directions_body_[index] = direction_body;
};

}); // goog.scope
