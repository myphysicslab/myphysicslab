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

import { Util, Printable } from '../util/Util.js'

/** An object that provides information about its energy state via an
{@link EnergyInfo} instance.

### Potential Energy Offset

It is only changes in potential energy that are meaningful. We can add a constant to
the potential energy of a system, and still see the same pattern of changes.

It is often desirable that potential energy be in a specific numerical range. For
example, we might want an object resting on the ground to have zero potential energy.

The potential energy reported in {@link EnergySystem.getEnergyInfo} is the sum of the
calculated potential energy and the constant potential energy offset.
See {@link EnergySystem.setPEOffset}.

*/
export interface EnergySystem extends Printable {

/** Returns the current EnergyInfo for this system.
* @return an EnergyInfo object representing
*    the current energy of this system.
*/
getEnergyInfo(): EnergyInfo;

/** Returns the potential energy offset.
@return the potential energy offset
*/
getPEOffset(): number;

/** Sets the potential energy offset.
* @param value the potential energy offset
*/
setPEOffset(value: number): void;

};  // end EnergySystem interface

// ********************** EnergyInfo ****************************

/** Provides information about an {@link EnergySystem}, such as
potential and kinetic energy. The potential and translational energy are always a valid
number. The rotational energy, work done,and initial energy can be `NaN` when they are
not defined.

## Potential Energy

For simulations where gravity operates in the vertical direction, there are methods
here to help calculate the potential energy of a MassObject. Potential energy has an
arbitrary zero level. MassObject has a method
{@link lab/model/MassObject.MassObject.setZeroEnergyLevel}
where you can set the zero level used by a ForceLaw like GravityLaw in its method
{@link lab/model/GravityLaw.GravityLaw.getPotentialEnergy}.
*/
export class EnergyInfo {
  private potential_: number;
  private translational_: number;
  private rotational_: number;
  private workDone_: number;
  private initialEnergy_: number;

/**
* @param potential the potential energy of the system, default is zero
* @param translational the translational energy of the system, default is zero
* @param rotational the rotational energy of the system, default is NaN
* @param workDone the amount of work done on the system, default is NaN
* @param initialEnergy the initial energy of the system, default is NaN
*/
constructor(potential?: number, translational?: number, rotational?: number,
    workDone?: number, initialEnergy?: number) {
  this.potential_ = potential || 0;
  this.translational_ = translational || 0;
  this.rotational_ = (rotational === undefined) ? NaN : rotational;
  this.workDone_ = (workDone === undefined) ? NaN : workDone;
  this.initialEnergy_ = (initialEnergy === undefined) ? NaN : initialEnergy;
};

/** @inheritDoc */
toString() {
  return 'EnergyInfo{potential_: '+Util.NF(this.potential_)
      +', translational_: '+Util.NF(this.translational_)
      +', rotational_: '+Util.NF(this.rotational_)
      +', workDone_: '+Util.NF(this.workDone_)
      +', initialEnergy_: '+Util.NF(this.initialEnergy_)
      +'}';
};

/** Returns the initial energy of the system, or NaN if not defined
* @return the initial energy of the system, or NaN if not defined
*/
getInitialEnergy(): number {
  return this.initialEnergy_;
};

/** Returns the potential energy of the system
* @return the potential energy of the system
*/
getPotential(): number {
  return this.potential_;
};

/** Returns the rotational energy of the system, or NaN if not defined
* @return the rotational energy of the system, or NaN if not defined
*/
getRotational(): number {
  return this.rotational_;
};

/** Returns the total energy of the system: potential + translational + rotational.
* @return the total energy of the system
*/
getTotalEnergy(): number {
  let tot = this.potential_ + this.translational_;
  if (!isNaN(this.rotational_)) {
    tot += this.rotational_;
  }
  return tot;
};

/** Returns the translational energy of the system
* @return the translational energy of the system
*/
getTranslational(): number {
  return this.translational_;
};

/** Returns the amount of work done on the system, or NaN if not defined
* @return the amount of work done on the system, or NaN if not defined
*/
getWorkDone(): number {
  return this.workDone_;
};

/** Sets  the initial energy of the system
* @param value the initial energy of the system, or NaN if not defined
*/
setInitialEnergy(value: number): void {
  this.initialEnergy_ = value;
};

/** Sets the potential energy of the system
* @param value the potential energy of the system
*/
setPotential(value: number): void {
  this.potential_ = value;
};

/** Sets the rotational energy of the system
* @param value the rotational energy of the system, or NaN if not defined
*/
setRotational(value: number): void {
  this.rotational_ = value;
};

/** Sets the translational energy of the system
* @param value the translational energy of the system
*/
setTranslational(value: number): void {
  this.translational_ = value;
};

/** Sets the amount of work done on the system
* @param value the amount of work done on the system, or NaN if not defined
*/
setWorkDone(value: number): void {
  this.workDone_ = value;
};

static en: i18n_strings = {
  POTENTIAL_ENERGY: 'potential energy',
  TRANSLATIONAL_ENERGY: 'translational energy',
  KINETIC_ENERGY: 'kinetic energy',
  ROTATIONAL_ENERGY: 'rotational energy',
  TOTAL: 'total',
  TOTAL_ENERGY: 'total energy',
  PE_OFFSET: 'potential energy offset'
};

static de_strings: i18n_strings = {
  POTENTIAL_ENERGY: 'potenzielle Energie',
  TRANSLATIONAL_ENERGY: 'Translationsenergie',
  KINETIC_ENERGY: 'kinetische Energie',
  ROTATIONAL_ENERGY: 'Rotationsenergie',
  TOTAL: 'gesamt',
  TOTAL_ENERGY: 'gesamte Energie',
  PE_OFFSET: 'Potenzielle Energie Ausgleich'
};

static readonly i18n = Util.LOCALE === 'de' ? EnergyInfo.de_strings : EnergyInfo.en;

} // end EnergyInfo class

type i18n_strings = {
  POTENTIAL_ENERGY: string,
  TRANSLATIONAL_ENERGY: string,
  KINETIC_ENERGY: string,
  ROTATIONAL_ENERGY: string,
  TOTAL: string,
  TOTAL_ENERGY: string,
  PE_OFFSET: string
}

Util.defineGlobal('lab$model$EnergyInfo', EnergyInfo);
