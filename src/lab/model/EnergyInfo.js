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

goog.provide('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var NF = myphysicslab.lab.util.UtilityCore.NF;

/** Provides information about an
{@link myphysicslab.lab.model.EnergySystem EnergySystem}, such as potential and
kinetic energy. The potential and translational energy are always a valid number. The
rotational energy, work done,and initial energy can be `NaN` when they are not defined.

## Potential Energy

For simulations where gravity operates in the vertical direction, there are methods here
to help calculate the potential energy of a MassObject.
Potential energy has an arbitrary zero level. MassObject
has a method {@link myphysicslab.lab.model.MassObject#setZeroEnergyLevel}
where you can set the zero level used by a ForceLaw like GravityLaw in its method
{@link myphysicslab.lab.model.GravityLaw#getPotentialEnergy}.

* @param {number=} potential the potential energy of the system, default is zero
* @param {number=} translational the translational energy of the system, default is zero
* @param {number=} rotational the rotational energy of the system, default is NaN
* @param {number=} workDone the amount of work done on the system, default is NaN
* @param {number=} initialEnergy the initial energy of the system, default is NaN
* @constructor
* @final
* @struct
*/
myphysicslab.lab.model.EnergyInfo = function(potential, translational,
    rotational, workDone, initialEnergy) {
  /**
  * @type {number}
  * @private
  */
  this.potential_ = potential || 0;
  /**
  * @type {number}
  * @private
  */
  this.translational_ = translational || 0;
  /**
  * @type {number}
  * @private
  */
  this.rotational_ = (rotational === undefined) ? UtilityCore.NaN : rotational;
  /**
  * @type {number}
  * @private
  */
  this.workDone_ = (workDone === undefined) ? UtilityCore.NaN : workDone;
  /**
  * @type {number}
  * @private
  */
  this.initialEnergy_ = (initialEnergy === undefined) ? UtilityCore.NaN : initialEnergy;
};
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  EnergyInfo.prototype.toString = function() {
    return 'EnergyInfo{potential_: '+NF(this.potential_)
        +', translational_: '+NF(this.translational_)
        +', rotational_: '+NF(this.rotational_)
        +', workDone_: '+NF(this.workDone_)
        +', initialEnergy_: '+NF(this.initialEnergy_)
        +'}';
  };
};

/** Returns the initial energy of the system, or NaN if not defined
* @return {number} the initial energy of the system, or NaN if not defined
*/
EnergyInfo.prototype.getInitialEnergy = function() {
  return this.initialEnergy_;
};

/** Returns the potential energy of the system
* @return {number} the potential energy of the system
*/
EnergyInfo.prototype.getPotential = function() {
  return this.potential_;
};

/** Returns the rotational energy of the system, or NaN if not defined
* @return {number} the rotational energy of the system, or NaN if not defined
*/
EnergyInfo.prototype.getRotational = function() {
  return this.rotational_;
};

/** Returns the total energy of the system: potential + translational + rotational.
* @return {number} the total energy of the system
*/
EnergyInfo.prototype.getTotalEnergy = function() {
  var tot = this.potential_ + this.translational_;
  if (!isNaN(this.rotational_)) {
    tot += this.rotational_;
  }
  return tot;
};

/** Returns the translational energy of the system
* @return {number} the translational energy of the system
*/
EnergyInfo.prototype.getTranslational = function() {
  return this.translational_;
};

/** Returns the amount of work done on the system, or NaN if not defined
* @return {number} the amount of work done on the system, or NaN if not defined
*/
EnergyInfo.prototype.getWorkDone = function() {
  return this.workDone_;
};

/** Sets  the initial energy of the system
* @param {number} value the initial energy of the system, or NaN if not defined
*/
EnergyInfo.prototype.setInitialEnergy = function(value) {
  this.initialEnergy_ = value;
};

/** Sets the potential energy of the system
* @param {number} value the potential energy of the system
*/
EnergyInfo.prototype.setPotential = function(value) {
  this.potential_ = value;
};

/** Sets the rotational energy of the system
* @param {number} value the rotational energy of the system, or NaN if not defined
*/
EnergyInfo.prototype.setRotational = function(value) {
  this.rotational_ = value;
};

/** Sets the translational energy of the system
* @param {number} value the translational energy of the system
*/
EnergyInfo.prototype.setTranslational = function(value) {
  this.translational_ = value;
};

/** Sets the amount of work done on the system
* @param {number} value the amount of work done on the system, or NaN if not defined
*/
EnergyInfo.prototype.setWorkDone = function(value) {
  this.workDone_ = value;
};

}); // goog.scope
