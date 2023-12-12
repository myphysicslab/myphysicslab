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

import { Force } from './Force.js';
import { ForceLaw } from './ForceLaw.js';
import { MassObject } from './MassObject.js';
import { Util } from '../util/Util.js';

/** A ForceLaw that applies a single constant Force. The Force can be set to `null`, in
which case this ForceLaw does nothing.

**TO DO**  Be able to add several constant forces, and remove them.

**TO DO**  Be able to specify a RigidBody and location on the RigidBody,
           see for example RotatingTestForce
*/
export class ConstantForceLaw implements ForceLaw {
  private force_: null|Force;

/**
* @param force the constant Force to apply, or `null`
*/
constructor(force: null|Force) {
  this.force_ = force;
};

/** @inheritDoc */
toString() {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort() {
  return 'ConstantForceLaw{force='+this.force_+'}';
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return this.force_ != null ? [this.force_.getBody()] : [];
};

/** @inheritDoc */
calculateForces(): Force[] {
  if (this.force_ != null)
    return [this.force_];
  else
    return [];
};

/** @inheritDoc */
disconnect(): void {
};

/** Returns the constant Force that this ForceLaw applies or `null` if there is no
Force.
@return the constant Force that this ForceLaw applies or `null`
*/
getForce(): null|Force {
  return this.force_;
};

/** @inheritDoc */
getPotentialEnergy(): number {
  return 0;
};

/** Sets the constant Force that this ForceLaw applies
@param force the constant Force that this ForceLaw should apply, or `null`
*/
setForce(force: null|Force) {
  this.force_ = force;
};

} // end ConstantForceLaw class
Util.defineGlobal('lab$model$ConstantForceLaw', ConstantForceLaw);
