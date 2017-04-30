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

goog.provide('myphysicslab.lab.model.ConstantForceLaw');

goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var Force = myphysicslab.lab.model.Force;
var ForceLaw = myphysicslab.lab.model.ForceLaw;
var Util = myphysicslab.lab.util.Util;

/** A ForceLaw that applies a single constant Force. The Force can be set to `null`, in
which case this ForceLaw does nothing.

@todo  Be able to add several constant forces, and remove them.
@todo  Be able to specify a RigidBody and location on the RigidBody,
           see for example RotatingTestForce

* @param {?Force} force the constant Force to apply, or `null`
* @constructor
* @final
* @struct
* @implements {ForceLaw}
*/
myphysicslab.lab.model.ConstantForceLaw = function(force) {
  /**
  * @type {?Force}
  * @private
  */
  this.force_ = force;
};
var ConstantForceLaw = myphysicslab.lab.model.ConstantForceLaw;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ConstantForceLaw.prototype.toString = function() {
    return this.toStringShort();
  };

  /** @inheritDoc */
  ConstantForceLaw.prototype.toStringShort = function() {
    return 'ConstantForceLaw{force='+this.force_+'}';
  };
};

/** @inheritDoc */
ConstantForceLaw.prototype.getBodies = function() {
  return this.force_ != null ? [this.force_.getBody()] : [];
};

/** @inheritDoc */
ConstantForceLaw.prototype.calculateForces = function() {
  if (this.force_ != null)
    return [this.force_];
  else
    return [];
};

/** @inheritDoc */
ConstantForceLaw.prototype.disconnect = function() {
};

/** Returns the constant Force that this ForceLaw applies or `null` if there is no
Force.
@return {?Force} the constant Force that this ForceLaw applies or `null`
*/
ConstantForceLaw.prototype.getForce = function() {
  return this.force_;
};

/** @inheritDoc */
ConstantForceLaw.prototype.getPotentialEnergy = function() {
  return 0;
};

/** Sets the constant Force that this ForceLaw applies
@param {?Force} force the constant Force that this ForceLaw should apply, or `null`
*/
ConstantForceLaw.prototype.setForce = function(force) {
  this.force_ = force;
};

}); // goog.scope
