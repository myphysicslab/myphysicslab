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

goog.module('myphysicslab.lab.model.ConstantForceLaw');

const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A ForceLaw that applies a single constant Force. The Force can be set to `null`, in
which case this ForceLaw does nothing.

@todo  Be able to add several constant forces, and remove them.
@todo  Be able to specify a RigidBody and location on the RigidBody,
           see for example RotatingTestForce

* @implements {ForceLaw}
*/
class ConstantForceLaw {
/**
* @param {?Force} force the constant Force to apply, or `null`
*/
constructor(force) {
  /**
  * @type {?Force}
  * @private
  */
  this.force_ = force;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'ConstantForceLaw{force='+this.force_+'}';
};

/** @override */
getBodies() {
  return this.force_ != null ? [this.force_.getBody()] : [];
};

/** @override */
calculateForces() {
  if (this.force_ != null)
    return [this.force_];
  else
    return [];
};

/** @override */
disconnect() {
};

/** Returns the constant Force that this ForceLaw applies or `null` if there is no
Force.
@return {?Force} the constant Force that this ForceLaw applies or `null`
*/
getForce() {
  return this.force_;
};

/** @override */
getPotentialEnergy() {
  return 0;
};

/** Sets the constant Force that this ForceLaw applies
@param {?Force} force the constant Force that this ForceLaw should apply, or `null`
*/
setForce(force) {
  this.force_ = force;
};

} //end class
exports = ConstantForceLaw;
